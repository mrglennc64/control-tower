import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { CreditTask } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readJson<CreditTask[]>("credit-tasks.json"));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const tasks: CreditTask[] = Array.isArray(body?.tasks) ? body.tasks : [];
  await writeJson("credit-tasks.json", tasks);
  return NextResponse.json({ ok: true });
}
