import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import {
  firecrawlSearch,
  firecrawlScrape,
  camofoxScrape,
  getIntegrations,
  hunterDomainSearch,
  domainOf,
} from "@/lib/integrations";
import { chat } from "@/lib/ai";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Aggregators/social/blogs — never treat these as acquirer companies.
const SKIP = new Set([
  "reddit.com", "medium.com", "youtube.com", "linkedin.com", "quora.com",
  "twitter.com", "x.com", "facebook.com", "wikipedia.org", "github.com",
  "ycombinator.com", "substack.com", "forbes.com", "techcrunch.com",
  "google.com", "bing.com", "pinterest.com", "instagram.com",
]);

type Firm = { name: string; website: string };

// Use the AI gateway to pull real firm names + websites out of a scraped page.
async function extractFirms(markdown: string, query: string): Promise<Firm[]> {
  const res = await chat([
    {
      role: "system",
      content:
        "Extract the actual companies/firms that ACQUIRE or BUY businesses listed on this page. " +
        "Respond with STRICT JSON ONLY: an array of {\"name\": string, \"website\": string}. " +
        "Use each firm's own website domain (not the article's site). Skip the publisher/author, " +
        "skip generic blog/aggregator sites, skip anything that isn't a real acquirer. If none, return [].",
    },
    { role: "user", content: `Context: ${query}\n\nPage:\n${markdown.slice(0, 6000)}` },
  ]);
  const m = res.text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query: string =
    (typeof body?.query === "string" && body.query.trim()) ||
    "firms that acquire or buy B2B SaaS / software / IP businesses";
  const count = Math.max(1, Math.min(12, Number(body?.count) || 8));

  let hits;
  try {
    hits = await firecrawlSearch(query, 6);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Prefer the self-hosted Camofox stealth browser (proxy-rotated, free) and
  // fall back to Firecrawl. Decided once per request.
  const useCamofox = !!(await getIntegrations()).camofoxKey;
  const scrapePage = async (u: string): Promise<string> => {
    if (useCamofox) {
      try {
        const s = await camofoxScrape(u);
        if (s && s.length > 60) return s;
      } catch {
        /* fall through to Firecrawl */
      }
    }
    return firecrawlScrape(u);
  };

  // Deep pass: scrape up to 3 result pages and AI-extract real firms.
  const firms = new Map<string, Firm>(); // keyed by domain
  let scraped = 0;
  for (const hit of hits) {
    if (scraped >= 3 || firms.size >= count) break;
    const pubDomain = domainOf(hit.url);
    try {
      const md = await scrapePage(hit.url);
      if (!md) continue;
      scraped++;
      for (const f of await extractFirms(md, query)) {
        const d = domainOf(f.website?.startsWith("http") ? f.website : `https://${f.website}`);
        if (!d || SKIP.has(d) || d === pubDomain || firms.has(d)) continue;
        firms.set(d, { name: f.name || d, website: d });
      }
    } catch {
      // skip this page
    }
  }

  // Fallback: if extraction found nothing, use the (filtered) search domains.
  if (firms.size === 0) {
    for (const hit of hits) {
      const d = domainOf(hit.url);
      if (!d || SKIP.has(d) || firms.has(d)) continue;
      firms.set(d, { name: hit.title || d, website: d });
    }
  }

  const contacts = await readJson<Contact[]>("contacts.json");
  const haveDomain = new Set(
    contacts.map((c) => domainOf(c.notes.match(/https?:\/\/\S+/)?.[0] ?? "")).filter(Boolean),
  );
  const now = new Date().toISOString();
  const added: string[] = [];
  let withEmail = 0;

  for (const [domain, firm] of firms) {
    if (added.length >= count) break;
    if (haveDomain.has(domain)) continue;

    const emails = await hunterDomainSearch(domain);
    const primary = emails.sort((a, b) => b.confidence - a.confidence)[0];
    if (primary?.email) withEmail++;

    const noteLines = [
      `https://${domain}`,
      ...emails.slice(0, 5).map((e) => `${e.name || "?"} <${e.email}> ${e.role}`.trim()),
    ].filter(Boolean);

    contacts.push({
      id: randomUUID(),
      name: firm.name,
      email: primary?.email ?? "",
      company: domain,
      phone: "",
      tags: ["acquirer", "web-found"],
      notes: noteLines.join("\n"),
      createdAt: now,
      updatedAt: now,
    });
    added.push(firm.name);
  }

  await writeJson("contacts.json", contacts);
  return NextResponse.json({ added: added.length, withEmail, scraped, names: added });
}
