import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { CreditProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readJson<CreditProfile>("credit-profile.json"));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const profile: CreditProfile = {
    ein: String(body?.ein ?? ""),
    dunsNumber: String(body?.dunsNumber ?? ""),
    paydex: Number(body?.paydex) || 0,
    businessBank: !!body?.businessBank,
    notes: String(body?.notes ?? ""),
    updatedAt: new Date().toISOString(),
  };
  await writeJson("credit-profile.json", profile);
  return NextResponse.json(profile);
}
