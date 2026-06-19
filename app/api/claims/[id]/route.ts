import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { RoyaltyClaim } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const claims = await readJson<RoyaltyClaim[]>("claims.json");
  const idx = claims.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const editable: (keyof RoyaltyClaim)[] = [
    "artist",
    "track",
    "isrc",
    "estimatedRecovery",
    "recoveredAmount",
    "feeRate",
    "stage",
    "attorney",
    "bundle",
    "filedDate",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      (claims[idx] as unknown as Record<string, unknown>)[key] = patch[key];
    }
  }
  claims[idx].updatedAt = new Date().toISOString();
  await writeJson("claims.json", claims);
  return NextResponse.json(claims[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const claims = await readJson<RoyaltyClaim[]>("claims.json");
  const next = claims.filter((c) => c.id !== id);
  if (next.length === claims.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("claims.json", next);
  return NextResponse.json({ ok: true });
}
