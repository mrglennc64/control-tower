"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ChatMsg, Conversation } from "@/lib/types";

type ChatSummary = { id: string; title: string; updatedAt: string; count: number };

// --- PDF text extraction (client-side, pdf.js from CDN) -------------------
type PdfTextItem = { str?: string };
type PdfPage = { getTextContent: () => Promise<{ items: PdfTextItem[] }> };
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfLib = {
  getDocument: (o: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> };
  GlobalWorkerOptions: { workerSrc: string };
};
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build";

function loadPdfjs(): Promise<PdfLib> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { pdfjsLib?: PdfLib };
    if (w.pdfjsLib) return resolve(w.pdfjsLib);
    const s = document.createElement("script");
    s.src = `${PDFJS}/pdf.min.js`;
    s.onload = () => {
      const lib = (window as unknown as { pdfjsLib: PdfLib }).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.js`;
      resolve(lib);
    };
    s.onerror = () => reject(new Error("Failed to load PDF library"));
    document.body.appendChild(s);
  });
}

const PDF_CHAR_CAP = 12000;

async function extractPdfText(file: File): Promise<string> {
  const lib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  let out = "";
  const maxPages = Math.min(pdf.numPages, 50);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str ?? "").join(" ") + "\n";
    if (out.length > PDF_CHAR_CAP + 2000) break;
  }
  return out.trim();
}

// --- Puter (client-side, no key) for image/vision; takes a File directly ----
function loadPuter(): Promise<{
  ai: { chat: (prompt: string, media?: unknown) => Promise<unknown> };
}> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { puter?: unknown };
    if (w.puter) return resolve(w.puter as never);
    const s = document.createElement("script");
    s.src = "https://js.puter.com/v2/";
    s.onload = () => resolve(w.puter as never);
    s.onerror = () => reject(new Error("Failed to load Puter"));
    document.body.appendChild(s);
  });
}
function puterText(r: unknown): string {
  if (typeof r === "string") return r;
  const o = r as { message?: { content?: string }; text?: string };
  return o?.message?.content ?? o?.text ?? JSON.stringify(r);
}

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
  const [attaching, setAttaching] = useState(false);
  const [image, setImage] = useState<File | null>(null);
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

  async function saveToStrategy(content: string) {
    await fetch(api("/api/strategy"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: content.slice(0, 50),
        content,
        source: "chat",
      }),
    });
    alert("Saved to Strategy.");
  }

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAttaching(true);
    try {
      const text = await extractPdfText(file);
      if (!text) throw new Error("No extractable text (scanned/image PDF?)");
      const capped = text.slice(0, PDF_CHAR_CAP);
      const truncated = text.length > PDF_CHAR_CAP ? "\n\n[document truncated]" : "";
      let id = activeId;
      if (!id) {
        const r = await fetch(api("/api/chats"), { method: "POST" });
        const c: Conversation = await r.json();
        id = c.id;
        setActiveId(id);
        await loadList();
      }
      const docMsg: ChatMsg = {
        role: "user",
        content: `📎 PDF: ${file.name}\n\n${capped}${truncated}`,
      };
      const next = [...messages, docMsg];
      setMessages(next);
      await patch(id!, { messages: next });
    } catch (err) {
      alert(`PDF read failed: ${(err as Error).message}`);
    }
    setAttaching(false);
  }

  async function send() {
    if ((!input.trim() && !image) || busy) return;
    let id = activeId;
    const firstMessage = messages.length === 0;
    if (!id) {
      const r = await fetch(api("/api/chats"), { method: "POST" });
      const c: Conversation = await r.json();
      id = c.id;
      setActiveId(id);
      await loadList();
    }
    const img = image; // capture before clearing
    const promptText =
      input.trim() ||
      (img ? "Describe this screenshot and call out anything important." : "");
    const userMsg: ChatMsg = {
      role: "user",
      content: img
        ? `🖼️ ${img.name}${promptText ? `\n\n${promptText}` : ""}`
        : promptText,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    await patch(id!, { messages: next });

    try {
      let content: string;
      let viaLabel = "";
      if (img) {
        // Vision via Puter (free, no key) — takes the File directly.
        const puter = await loadPuter();
        const r = await puter.ai.chat(promptText, img);
        content = puterText(r);
        viaLabel = "Puter (vision)";
        setImage(null);
      } else {
        const r = await fetch(api("/api/ai/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [SYSTEM, ...next] }),
        });
        const j = await r.json();
        content =
          j.text ||
          "(no response — all providers failed. Add a key in Settings, or try the Ask box for Puter.)";
        viaLabel = j.provider ? `${j.provider} · ${j.model}` : "";
      }
      const final = [...next, { role: "assistant", content } as ChatMsg];
      setMessages(final);
      setVia(viaLabel);
      await patch(id!, { messages: final });
      if (firstMessage) {
        await patch(id!, { title: userMsg.content.replace(/^🖼️ /, "").slice(0, 48) });
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
          {messages.map((m, i) => {
            const isDoc = m.content.startsWith("📎 PDF:");
            const isImg = m.content.startsWith("🖼️ ");
            const docName = isDoc
              ? m.content.split("PDF:")[1]?.split("\n")[0]?.trim()
              : "";
            return (
              <div key={i} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%]">
                  <div
                    className="whitespace-pre-wrap rounded-lg px-3 py-2 text-sm"
                    style={{
                      background: m.role === "user" ? "var(--ct-accent)" : "var(--ct-surface-2)",
                      color: m.role === "user" ? "#000" : "var(--ct-text)",
                    }}
                  >
                    {isDoc ? `📎 ${docName} — attached (AI can read it)` : m.content}
                  </div>
                  {isImg && (
                    <div className="mt-1 text-xs" style={{ color: "var(--ct-muted)" }}>
                      🖼️ screenshot sent to vision AI (image not stored)
                    </div>
                  )}
                  {m.role === "assistant" && !isDoc && (
                    <button
                      onClick={() => saveToStrategy(m.content)}
                      className="mt-1 text-xs"
                      style={{ color: "var(--ct-teal)" }}
                    >
                      ★ Save to Strategy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
        {image && (
          <div className="flex items-center gap-2 px-4 pb-1 text-xs" style={{ color: "var(--ct-teal)" }}>
            🖼️ {image.name} attached
            <button onClick={() => setImage(null)} style={{ color: "var(--ct-red)" }}>remove</button>
          </div>
        )}
        <div className="flex items-end gap-2 border-t p-3">
          <label
            className="cursor-pointer rounded-md border px-3 py-2 text-sm"
            style={{ color: "var(--ct-muted)" }}
            title="Attach a PDF for the AI to read"
          >
            {attaching ? "📎…" : "📎 PDF"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={onPdf}
              disabled={attaching}
            />
          </label>
          <label
            className="cursor-pointer rounded-md border px-3 py-2 text-sm"
            style={{ color: "var(--ct-muted)" }}
            title="Attach a screenshot/image for the AI to see"
          >
            🖼️ Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) setImage(f);
              }}
            />
          </label>
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
            disabled={busy || (!input.trim() && !image)}
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
