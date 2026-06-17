import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Milestone } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const milestones = await readJson<Milestone[]>("milestones.json");
  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const milestones = await readJson<Milestone[]>("milestones.json");
  const now = new Date().toISOString();
  const milestone: Milestone = {
    id: randomUUID(),
    title: body.title ?? "Untitled",
    date: body.date ?? null,
    category: body.category ?? "Other",
    done: body.done ?? false,
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  milestones.push(milestone);
  await writeJson("milestones.json", milestones);
  return NextResponse.json(milestone, { status: 201 });
}
