import { NextRequest, NextResponse } from "next/server";
import { getProviders, saveProviders, type AIProvider } from "@/lib/ai";

export const dynamic = "force-dynamic";

// GET returns providers with the key MASKED (never expose stored keys).
export async function GET() {
  const providers = await getProviders();
  const safe = providers.map((p) => ({
    id: p.id,
    label: p.label,
    baseUrl: p.baseUrl,
    model: p.model,
    enabled: p.enabled,
    hasKey: !!p.apiKey,
    keyHint: p.apiKey ? `…${p.apiKey.slice(-4)}` : "",
  }));
  return NextResponse.json(safe);
}

// PUT merges by id. apiKey is only updated when a non-empty value is sent,
// so saving from the (masked) UI never wipes an existing key.
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const incoming: Partial<AIProvider>[] = Array.isArray(body?.providers)
    ? body.providers
    : [];
  const current = await getProviders();
  const byId = new Map(current.map((p) => [p.id, p]));

  for (const upd of incoming) {
    if (!upd.id) continue;
    const existing = byId.get(upd.id);
    if (!existing) continue;
    if (typeof upd.label === "string") existing.label = upd.label;
    if (typeof upd.baseUrl === "string") existing.baseUrl = upd.baseUrl;
    if (typeof upd.model === "string") existing.model = upd.model;
    if (typeof upd.enabled === "boolean") existing.enabled = upd.enabled;
    if (typeof upd.apiKey === "string" && upd.apiKey.trim()) {
      existing.apiKey = upd.apiKey.trim();
    }
  }
  await saveProviders([...byId.values()]);
  return NextResponse.json({ ok: true });
}
