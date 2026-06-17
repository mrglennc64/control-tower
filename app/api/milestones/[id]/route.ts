import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Milestone } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const milestones = await readJson<Milestone[]>("milestones.json");
  const idx = milestones.findIndex((m) => m.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const editable: (keyof Milestone)[] = [
    "title",
    "date",
    "category",
    "done",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      (milestones[idx] as unknown as Record<string, unknown>)[key] = patch[key];
    }
  }
  milestones[idx].updatedAt = new Date().toISOString();
  await writeJson("milestones.json", milestones);
  return NextResponse.json(milestones[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const milestones = await readJson<Milestone[]>("milestones.json");
  const next = milestones.filter((m) => m.id !== id);
  if (next.length === milestones.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("milestones.json", next);
  return NextResponse.json({ ok: true });
}
