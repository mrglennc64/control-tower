import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import { firecrawlSearch, hunterDomainSearch, domainOf } from "@/lib/integrations";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Find acquirer leads: Firecrawl web search -> domain -> Hunter.io emails -> Contacts.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query: string =
    (typeof body?.query === "string" && body.query.trim()) ||
    "companies that acquire or buy B2B SaaS / software / IP businesses";
  const count = Math.max(1, Math.min(10, Number(body?.count) || 6));

  let hits;
  try {
    hits = await firecrawlSearch(query, count);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const contacts = await readJson<Contact[]>("contacts.json");
  const haveDomain = new Set(
    contacts.map((c) => domainOf(c.notes.match(/https?:\/\/\S+/)?.[0] ?? "")).filter(Boolean),
  );
  const now = new Date().toISOString();
  const added: string[] = [];
  let withEmail = 0;
  const seen = new Set<string>();

  for (const hit of hits) {
    const domain = domainOf(hit.url);
    if (!domain || seen.has(domain) || haveDomain.has(domain)) continue;
    seen.add(domain);

    const emails = await hunterDomainSearch(domain);
    const primary = emails.sort((a, b) => b.confidence - a.confidence)[0];
    if (primary?.email) withEmail++;

    const noteLines = [
      hit.description,
      hit.url,
      ...emails.slice(0, 5).map((e) => `${e.name || "?"} <${e.email}> ${e.role}`.trim()),
    ].filter(Boolean);

    contacts.push({
      id: randomUUID(),
      name: hit.title || domain,
      email: primary?.email ?? "",
      company: domain,
      phone: "",
      tags: ["acquirer", "web-found"],
      notes: noteLines.join("\n"),
      createdAt: now,
      updatedAt: now,
    });
    added.push(hit.title || domain);
  }

  await writeJson("contacts.json", contacts);
  return NextResponse.json({ added: added.length, withEmail, names: added });
}
