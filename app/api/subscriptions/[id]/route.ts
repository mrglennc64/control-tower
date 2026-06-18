import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Subscription } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const subs = await readJson<Subscription[]>("subscriptions.json");
  const idx = subs.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const editable: (keyof Subscription)[] = [
    "name",
    "provider",
    "account",
    "plan",
    "amount",
    "currency",
    "cycle",
    "nextRenewal",
    "autoRenew",
    "status",
    "paymentMethod",
    "payments",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      (subs[idx] as unknown as Record<string, unknown>)[key] = patch[key];
    }
  }
  subs[idx].updatedAt = new Date().toISOString();
  await writeJson("subscriptions.json", subs);
  return NextResponse.json(subs[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const subs = await readJson<Subscription[]>("subscriptions.json");
  const next = subs.filter((s) => s.id !== id);
  if (next.length === subs.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("subscriptions.json", next);
  return NextResponse.json({ ok: true });
}
