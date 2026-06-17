"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ChatMsg, Conversation } from "@/lib/types";

type ChatSummary = { id: string; title: string; updatedAt: string; count: number };

const SYSTEM: ChatMsg | { role: "system"; content: string } = {
  role: "system",
  content:
    "You are the assistant inside Glenn's Founder Control Tower. Be concise and practical. " +
    "Help with acquisitions, outreach, IP sales, and running the business.",
};

export default function ChatPage() {
  const [list, setList] = useState<ChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [via, setVia] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function loadList() {
    const r = await fetch(api("/api/chats"));
    setList(await r.json());
  }
  useEffect(() => {
    loadList();
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function openChat(id: string) {
    setActiveId(id);
    setVia("");
    const r = await fetch(api(`/api/chats/${id}`));
    const c: Conversation = await r.json();
    setMessages(c.messages || []);
  }

  async function newChat() {
    const r = await fetch(api("/api/chats"), { method: "POST" });
    const c: Conversation = await r.json();
    await loadList();
    setActiveId(c.id);
    setMessages([]);
    setVia("");
  }

  async function del(id: string) {
    if (!confirm("Delete this chat?")) return;
    await fetch(api(`/api/chats/${id}`), { method: "DELETE" });
    if (id === activeId) {
      setActiveId(null);
      setMessages([]);
    }
    loadList();
  }

  async function patch(id: string, body: object) {
    await fetch(api(`/api/chats/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function send() {
    if (!input.trim() || busy) return;
    let id = activeId;
    const firstMessage = messages.length === 0;
    if (!id) {
      const r = await fetch(api("/api/chats"), { method: "POST" });
      const c: Conversation = await r.json();
      id = c.id;
      setActiveId(id);
      await loadList();
    }
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    await patch(id!, { messages: next });

    try {
      const r = await fetch(api("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [SYSTEM, ...next] }),
      });
      const j = await r.json();
      const content =
        j.text ||
        "(no response — all providers failed. Add a key in Settings, or try the Ask box for Puter.)";
      const final = [...next, { role: "assistant", content } as ChatMsg];
      setMessages(final);
      setVia(j.provider ? `${j.provider} · ${j.model}` : "");
      await patch(id!, { messages: final });
      if (firstMessage) {
        await patch(id!, { title: userMsg.content.slice(0, 48) });
        loadList();
      }
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: `Error: ${(e as Error).message}` },
      ]);
    }
    setBusy(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* conversation list */}
      <aside className="flex w-60 shrink-0 flex-col rounded-lg border" style={{ background: "var(--ct-surface)" }}>
        <button
          onClick={newChat}
          className="m-3 rounded-md px-3 py-2 text-sm font-medium text-black"
          style={{ background: "var(--ct-accent)" }}
        >
          + New chat
        </button>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {list.length === 0 && (
            <p className="px-2 text-xs" style={{ color: "var(--ct-muted)" }}>No chats yet.</p>
          )}
          {list.map((c) => (
            <div
              key={c.id}
              className="group flex items-center justify-between rounded px-2 py-2 text-sm"
              style={{ background: c.id === activeId ? "var(--ct-surface-2)" : "transparent" }}
            >
              <button onClick={() => openChat(c.id)} className="flex-1 truncate text-left">
                {c.title}
              </button>
              <button
                onClick={() => del(c.id)}
                className="ml-2 hidden text-xs group-hover:block"
                style={{ color: "var(--ct-red)" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* thread */}
      <div className="flex flex-1 flex-col rounded-lg border" style={{ background: "var(--ct-surface)" }}>
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !busy && (
            <div className="mt-10 text-center text-sm" style={{ color: "var(--ct-muted)" }}>
              Start a conversation. History is saved on your server.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm"
                style={{
                  background: m.role === "user" ? "var(--ct-accent)" : "var(--ct-surface-2)",
                  color: m.role === "user" ? "#000" : "var(--ct-text)",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="mb-4 flex justify-start">
              <div className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--ct-surface-2)", color: "var(--ct-muted)" }}>
                Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {via && (
          <div className="px-4 pb-1 text-xs" style={{ color: "var(--ct-muted)" }}>via {via}</div>
        )}
        <div className="flex gap-2 border-t p-3">
          <textarea
            className="input min-h-[44px] flex-1 resize-none"
            placeholder="Message…  (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="rounded-md px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            style={{ background: "var(--ct-accent)" }}
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          border-radius: 0.375rem;
          border: 1px solid var(--ct-border);
          background: var(--ct-surface-2);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--ct-text);
        }
      `}</style>
    </div>
  );
}
