import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const subs = await readJson<Subscription[]>("subscriptions.json");
  return NextResponse.json(subs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const subs = await readJson<Subscription[]>("subscriptions.json");
  const now = new Date().toISOString();
  const sub: Subscription = {
    id: randomUUID(),
    name: body.name ?? "Untitled",
    provider: body.provider ?? "Hostinger",
    account: body.account ?? "",
    plan: body.plan ?? "",
    amount: Number(body.amount) || 0,
    currency: body.currency ?? "USD",
    cycle: body.cycle ?? "yearly",
    nextRenewal: body.nextRenewal ?? null,
    autoRenew: body.autoRenew ?? true,
    status: body.status ?? "active",
    paymentMethod: body.paymentMethod ?? "",
    payments: Array.isArray(body.payments) ? body.payments : [],
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  subs.push(sub);
  await writeJson("subscriptions.json", subs);
  return NextResponse.json(sub, { status: 201 });
}
