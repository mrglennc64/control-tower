import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const entities = await readJson<Entity[]>("entities.json");
  const idx = entities.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // Whitelist editable fields; never let id/createdAt be overwritten.
  const editable: (keyof Entity)[] = [
    "name",
    "entityType",
    "jurisdiction",
    "purpose",
    "ownership",
    "assets",
    "status",
    "nextFilingDate",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      (entities[idx] as unknown as Record<string, unknown>)[key] = patch[key];
    }
  }
  entities[idx].updatedAt = new Date().toISOString();
  await writeJson("entities.json", entities);
  return NextResponse.json(entities[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const entities = await readJson<Entity[]>("entities.json");
  const next = entities.filter((e) => e.id !== id);
  if (next.length === entities.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("entities.json", next);
  return NextResponse.json({ ok: true });
}
