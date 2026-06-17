import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Conversation, ChatMsg } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const chats = await readJson<Conversation[]>("chats.json");
  const chat = chats.find((c) => c.id === id);
  if (!chat) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(chat);
}

// PATCH: set messages and/or title (whole-conversation save).
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const chats = await readJson<Conversation[]>("chats.json");
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (Array.isArray(patch.messages)) {
    chats[idx].messages = patch.messages as ChatMsg[];
  }
  if (typeof patch.title === "string" && patch.title.trim()) {
    chats[idx].title = patch.title.trim().slice(0, 80);
  }
  chats[idx].updatedAt = new Date().toISOString();
  await writeJson("chats.json", chats);
  return NextResponse.json(chats[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const chats = await readJson<Conversation[]>("chats.json");
  const next = chats.filter((c) => c.id !== id);
  if (next.length === chats.length)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  await writeJson("chats.json", next);
  return NextResponse.json({ ok: true });
}
