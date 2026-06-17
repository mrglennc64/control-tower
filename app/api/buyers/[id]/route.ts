import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Buyer } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const buyers = await readJson<Buyer[]>("buyers.json");
  const idx = buyers.findIndex((b) => b.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // Whitelist editable fields; never let id/createdAt be overwritten.
  const editable: (keyof Buyer)[] = [
    "name",
    "category",
    "fitScore",
    "stage",
    "lastActivity",
    "nextAction",
    "nextActionDate",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      // @ts-expect-error indexed assignment across union is safe per whitelist
      buyers[idx][key] = patch[key];
    }
  }
  buyers[idx].updatedAt = new Date().toISOString();
  await writeJson("buyers.json", buyers);
  return NextResponse.json(buyers[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const buyers = await readJson<Buyer[]>("buyers.json");
  const next = buyers.filter((b) => b.id !== id);
  if (next.length === buyers.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("buyers.json", next);
  return NextResponse.json({ ok: true });
}
