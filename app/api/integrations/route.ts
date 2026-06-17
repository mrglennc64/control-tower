import { NextRequest, NextResponse } from "next/server";
import { getIntegrations, saveIntegrations } from "@/lib/integrations";

export const dynamic = "force-dynamic";

// GET returns whether each key is set (never the key itself).
export async function GET() {
  const i = await getIntegrations();
  return NextResponse.json({
    firecrawl: { hasKey: !!i.firecrawl, hint: i.firecrawl ? `…${i.firecrawl.slice(-4)}` : "" },
    hunterio: { hasKey: !!i.hunterio, hint: i.hunterio ? `…${i.hunterio.slice(-4)}` : "" },
  });
}

// PUT updates only the keys whose value is non-empty (blank = keep existing).
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const current = await getIntegrations();
  if (typeof body?.firecrawl === "string" && body.firecrawl.trim())
    current.firecrawl = body.firecrawl.trim();
  if (typeof body?.hunterio === "string" && body.hunterio.trim())
    current.hunterio = body.hunterio.trim();
  await saveIntegrations(current);
  return NextResponse.json({ ok: true });
}
