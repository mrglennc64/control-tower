import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { StrategyNote } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
  if (typeof v === "string")
    return v.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const notes = await readJson<StrategyNote[]>("strategy.json");
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (typeof patch.title === "string") notes[idx].title = patch.title;
  if (typeof patch.content === "string") notes[idx].content = patch.content;
  if ("tags" in patch) notes[idx].tags = normTags(patch.tags);
  if (typeof patch.pinned === "boolean") notes[idx].pinned = patch.pinned;
  notes[idx].updatedAt = new Date().toISOString();
  await writeJson("strategy.json", notes);
  return NextResponse.json(notes[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const notes = await readJson<StrategyNote[]>("strategy.json");
  const next = notes.filter((n) => n.id !== id);
  if (next.length === notes.length)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  await writeJson("strategy.json", next);
  return NextResponse.json({ ok: true });
}
