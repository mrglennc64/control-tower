// Lead-finder integrations: Firecrawl (web search + scrape) and Hunter.io
// (email finding). Keys live in DATA_DIR/integrations.json (gitignored,
// behind Basic Auth, masked in the API, never in the export bundle).
import { readJson, writeJson } from "./store";

export interface Integrations {
  firecrawl: string;
  hunterio: string;
  camofoxUrl: string; // local stealth browser, e.g. http://127.0.0.1:9377
  camofoxKey: string; // CAMOFOX_API_KEY
}

const DEFAULT: Integrations = {
  firecrawl: "",
  hunterio: "",
  camofoxUrl: "http://127.0.0.1:9377",
  camofoxKey: "",
};

export async function getIntegrations(): Promise<Integrations> {
  const x = await readJson<Partial<Integrations> | null>("integrations.json");
  if (!x || typeof x !== "object") {
    await writeJson("integrations.json", DEFAULT);
    return { ...DEFAULT };
  }
  return { ...DEFAULT, ...x };
}

export async function saveIntegrations(next: Integrations): Promise<void> {
  await writeJson("integrations.json", next);
}

export interface SearchHit {
  url: string;
  title: string;
  description: string;
}

// Firecrawl web search (POST /v1/search). Returns hits with url/title/description.
export async function firecrawlSearch(
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const { firecrawl } = await getIntegrations();
  if (!firecrawl) throw new Error("No Firecrawl key — add it in Settings.");
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawl}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl ${res.status}: ${(await res.text()).slice(0, 160)}`);
  }
  const j = await res.json();
  const data = Array.isArray(j?.data) ? j.data : [];
  return data.map((d: { url?: string; title?: string; description?: string }) => ({
    url: d.url ?? "",
    title: d.title ?? "",
    description: d.description ?? "",
  }));
}

// Firecrawl scrape (POST /v1/scrape) — returns the page as markdown.
export async function firecrawlScrape(url: string): Promise<string> {
  const { firecrawl } = await getIntegrations();
  if (!firecrawl) throw new Error("No Firecrawl key — add it in Settings.");
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawl}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"] }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`Firecrawl scrape ${res.status}`);
  const j = await res.json();
  return (j?.data?.markdown as string) ?? "";
}

// Camofox stealth-browser scrape (self-hosted, proxy-rotated). Creates a tab
// (navigates + loads), reads the accessibility snapshot (text + links — great
// for AI extraction), then closes the tab. Bypasses bot blocks Firecrawl can't.
export async function camofoxScrape(url: string): Promise<string> {
  const { camofoxUrl, camofoxKey } = await getIntegrations();
  if (!camofoxKey) throw new Error("Camofox not configured");
  const base = camofoxUrl || "http://127.0.0.1:9377";
  const headers = {
    Authorization: `Bearer ${camofoxKey}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(`${base}/tabs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      userId: "ct-leadfinder",
      sessionKey: `s${Date.now()}`,
      url,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`camofox tab ${res.status}`);
  const { tabId } = await res.json();
  if (!tabId) throw new Error("camofox: no tabId");
  try {
    let snap = "";
    for (let i = 0; i < 3; i++) {
      const sres = await fetch(
        `${base}/tabs/${tabId}/snapshot?userId=ct-leadfinder`,
        { headers, signal: AbortSignal.timeout(30000) },
      );
      if (sres.ok) {
        const j = await sres.json();
        snap = (j?.snapshot as string) ?? "";
        if (snap.length > 60) break;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return snap;
  } finally {
    fetch(`${base}/tabs/${tabId}?userId=ct-leadfinder`, {
      method: "DELETE",
      headers,
    }).catch(() => {});
  }
}

export interface FoundEmail {
  name: string;
  email: string;
  role: string;
  confidence: number;
}

// Hunter.io domain-search — same call Hunter's email_finder.py uses.
export async function hunterDomainSearch(domain: string): Promise<FoundEmail[]> {
  const { hunterio } = await getIntegrations();
  if (!hunterio) return [];
  const url = new URL("https://api.hunter.io/v2/domain-search");
  url.searchParams.set("domain", domain);
  url.searchParams.set("api_key", hunterio);
  url.searchParams.set("limit", "5");
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const j = await res.json();
    const emails = j?.data?.emails ?? [];
    return emails.map(
      (e: {
        first_name?: string;
        last_name?: string;
        value?: string;
        position?: string;
        confidence?: number;
      }) => ({
        name: `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim(),
        email: e.value ?? "",
        role: e.position ?? "",
        confidence: e.confidence ?? 0,
      }),
    );
  } catch {
    return [];
  }
}

export function domainOf(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
