import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { CreditAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readJson<CreditAccount[]>("credit-accounts.json"));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const accounts: CreditAccount[] = Array.isArray(body?.accounts)
    ? body.accounts
    : [];
  await writeJson("credit-accounts.json", accounts);
  return NextResponse.json({ ok: true });
}
