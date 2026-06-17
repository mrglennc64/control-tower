import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const entities = await readJson<Entity[]>("entities.json");
  return NextResponse.json(entities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entities = await readJson<Entity[]>("entities.json");
  const now = new Date().toISOString();
  const entity: Entity = {
    id: randomUUID(),
    name: body.name ?? "Untitled",
    entityType: body.entityType ?? "",
    jurisdiction: body.jurisdiction ?? "",
    purpose: body.purpose ?? "",
    ownership: body.ownership ?? "",
    assets: body.assets ?? "",
    status: body.status ?? "Active",
    nextFilingDate: body.nextFilingDate ?? null,
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  entities.push(entity);
  await writeJson("entities.json", entities);
  return NextResponse.json(entity, { status: 201 });
}
