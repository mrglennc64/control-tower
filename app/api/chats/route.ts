import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Conversation } from "@/lib/types";

export const dynamic = "force-dynamic";

// List conversations (newest first), without message bodies for a light list.
export async function GET() {
  const chats = await readJson<Conversation[]>("chats.json");
  const list = [...chats]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
      count: c.messages.length,
    }));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const chats = await readJson<Conversation[]>("chats.json");
  const now = new Date().toISOString();
  const chat: Conversation = {
    id: randomUUID(),
    title: body?.title || "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  chats.push(chat);
  await writeJson("chats.json", chats);
  return NextResponse.json(chat, { status: 201 });
}
