import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Buyer } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const buyers = await readJson<Buyer[]>("buyers.json");
  return NextResponse.json(buyers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const buyers = await readJson<Buyer[]>("buyers.json");
  const now = new Date().toISOString();
  const buyer: Buyer = {
    id: randomUUID(),
    name: body.name ?? "Untitled buyer",
    category: body.category ?? "strategic",
    fitScore: body.fitScore ?? 3,
    stage: body.stage ?? "Not contacted",
    lastActivity: body.lastActivity ?? null,
    nextAction: body.nextAction ?? "",
    nextActionDate: body.nextActionDate ?? null,
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  buyers.push(buyer);
  await writeJson("buyers.json", buyers);
  return NextResponse.json(buyer, { status: 201 });
}
