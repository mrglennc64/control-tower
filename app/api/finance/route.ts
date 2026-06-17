import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { FinanceState, FinanceEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readJson<FinanceState>("finance.json");
  return NextResponse.json(state);
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as Partial<FinanceState>;

  const entries: FinanceEntry[] = Array.isArray(body.entries)
    ? body.entries.map((e) => ({
        id: e.id,
        label: e.label ?? "",
        amount: Number(e.amount) || 0,
        kind: e.kind,
        date: e.date ?? null,
        notes: e.notes ?? "",
      }))
    : [];

  const state: FinanceState = {
    currency: body.currency || "SEK",
    cashOnHand: Number(body.cashOnHand) || 0,
    monthlyBurn: Number(body.monthlyBurn) || 0,
    entries,
    updatedAt: new Date().toISOString(),
  };

  await writeJson("finance.json", state);
  return NextResponse.json(state);
}
