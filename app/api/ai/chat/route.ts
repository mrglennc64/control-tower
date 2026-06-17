import { NextRequest, NextResponse } from "next/server";
import { chat, type ChatMessage } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  let messages: ChatMessage[];
  if (Array.isArray(body?.messages)) {
    messages = body.messages;
  } else if (typeof body?.prompt === "string") {
    messages = [{ role: "user", content: body.prompt }];
  } else {
    return NextResponse.json({ error: "prompt or messages required" }, { status: 400 });
  }
  const result = await chat(messages, { only: body?.only });
  return NextResponse.json(result);
}
