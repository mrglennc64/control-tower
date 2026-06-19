import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { RoyaltyClaim } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readJson<RoyaltyClaim[]>("claims.json"));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const claims = await readJson<RoyaltyClaim[]>("claims.json");
  const now = new Date().toISOString();
  const c: RoyaltyClaim = {
    id: randomUUID(),
    artist: body.artist ?? "Untitled",
    track: body.track ?? "",
    isrc: body.isrc ?? "",
    estimatedRecovery: Number(body.estimatedRecovery) || 0,
    recoveredAmount: Number(body.recoveredAmount) || 0,
    feeRate: body.feeRate != null ? Number(body.feeRate) : 0.05,
    stage: body.stage ?? "Lead",
    attorney: body.attorney ?? "",
    bundle: body.bundle ?? "",
    filedDate: body.filedDate ?? null,
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  claims.push(c);
  await writeJson("claims.json", claims);
  return NextResponse.json(c, { status: 201 });
}
