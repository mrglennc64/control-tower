import { NextRequest, NextResponse } from "next/server";
import { scoreLead } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Summarize + score a single lead/contact. Returns { summary, score, provider, model }.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const out = await scoreLead(body?.contact ?? {});
  return NextResponse.json(out);
}
