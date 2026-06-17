import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { StrategyNote } from "@/lib/types";

export const dynamic = "force-dynamic";

function normTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
  if (typeof v === "string")
    return v.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export async function GET() {
  const notes = await readJson<StrategyNote[]>("strategy.json");
  // pinned first, then newest
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const notes = await readJson<StrategyNote[]>("strategy.json");
  const now = new Date().toISOString();
  const note: StrategyNote = {
    id: randomUUID(),
    title: (body?.title ?? "").toString().trim() || "Untitled note",
    content: (body?.content ?? "").toString(),
    tags: normTags(body?.tags),
    source: (body?.source ?? "manual").toString(),
    pinned: !!body?.pinned,
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  await writeJson("strategy.json", notes);
  return NextResponse.json(note, { status: 201 });
}
