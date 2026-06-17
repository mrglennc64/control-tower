"use client";

import { useState } from "react";
import { api } from "@/lib/api";

// Lazy-load Puter's client-side SDK (no API key — "user pays" model).
function loadPuter(): Promise<{
  ai: { chat: (p: string) => Promise<unknown> };
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

export default function AskPage() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [via, setVia] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [usePuter, setUsePuter] = useState(false);

  async function viaPuter() {
    setBusy(true);
    setVia("Puter (no key)");
    setErrors([]);
    try {
      const puter = await loadPuter();
      const r = await puter.ai.chat(prompt);
      setAnswer(puterText(r));
    } catch (e) {
      setErrors([`Puter: ${(e as Error).message}`]);
    }
    setBusy(false);
  }

  async function send() {
    if (!prompt.trim()) return;
    setBusy(true);
    setAnswer("");
    setErrors([]);
    setVia("");
    if (usePuter) {
      await viaPuter();
      return;
    }
    try {
      const r = await fetch(api("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const j = await r.json();
      if (j.text) {
        setAnswer(j.text);
        setVia(`${j.provider} · ${j.model}`);
      } else {
        setErrors((j.tried ?? []).map((t: { id: string; error: string }) => `${t.id}: ${t.error}`));
      }
    } catch (e) {
      setErrors([(e as Error).message]);
    }
    setBusy(false);
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Ask AI</h1>
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          Rotates across your free-tier providers, falls back automatically. No keys? Use Puter.
        </p>
      </header>

      <textarea
        className="input min-h-32"
        placeholder="Ask anything…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={send}
          disabled={busy || !prompt.trim()}
          className="rounded-md px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          style={{ background: "var(--ct-accent)" }}
        >
          {busy ? "Thinking…" : "Send"}
        </button>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--ct-muted)" }}>
          <input
            type="checkbox"
            checked={usePuter}
            onChange={(e) => setUsePuter(e.target.checked)}
          />
          Use Puter (no key, runs in browser)
        </label>
      </div>

      {via && (
        <p className="mt-4 text-xs" style={{ color: "var(--ct-muted)" }}>via {via}</p>
      )}
      {answer && (
        <div
          className="mt-2 whitespace-pre-wrap rounded-lg border p-4 text-sm"
          style={{ background: "var(--ct-surface)" }}
        >
          {answer}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border p-4 text-sm" style={{ background: "var(--ct-surface)" }}>
          <div className="mb-2 font-medium" style={{ color: "var(--ct-red)" }}>
            All server providers failed:
          </div>
          <ul className="mb-3 list-disc pl-5 text-xs" style={{ color: "var(--ct-muted)" }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button
            onClick={viaPuter}
            className="rounded-md border px-3 py-2 text-xs"
            style={{ color: "var(--ct-teal)" }}
          >
            Try Puter (no key)
          </button>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
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
