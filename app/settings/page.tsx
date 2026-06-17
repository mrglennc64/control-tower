"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ProviderView {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
  hasKey: boolean;
  keyHint: string;
  keyInput: string; // local only — what the user types
}

export default function SettingsPage() {
  const [rows, setRows] = useState<ProviderView[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [test, setTest] = useState<Record<string, string>>({});

  // Lead-finder integration keys (Firecrawl + Hunter.io)
  const [intInfo, setIntInfo] = useState<{
    firecrawl: { hasKey: boolean; hint: string };
    hunterio: { hasKey: boolean; hint: string };
  } | null>(null);
  const [fc, setFc] = useState("");
  const [hio, setHio] = useState("");
  const [intMsg, setIntMsg] = useState("");

  async function load() {
    const r = await fetch(api("/api/ai/providers"));
    const data = await r.json();
    setRows(
      data.map((p: Omit<ProviderView, "keyInput">) => ({ ...p, keyInput: "" })),
    );
    const ir = await fetch(api("/api/integrations"));
    setIntInfo(await ir.json());
  }

  async function saveInt() {
    await fetch(api("/api/integrations"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(fc.trim() ? { firecrawl: fc.trim() } : {}),
        ...(hio.trim() ? { hunterio: hio.trim() } : {}),
      }),
    });
    setFc("");
    setHio("");
    setIntMsg("Saved.");
    load();
  }
  useEffect(() => {
    load();
  }, []);

  function update(id: string, patch: Partial<ProviderView>) {
    setRows((rs) => rs!.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function save() {
    if (!rows) return;
    setSaving(true);
    setMsg("");
    await fetch(api("/api/ai/providers"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providers: rows.map((r) => ({
          id: r.id,
          model: r.model,
          enabled: r.enabled,
          ...(r.keyInput.trim() ? { apiKey: r.keyInput.trim() } : {}),
        })),
      }),
    });
    setSaving(false);
    setMsg("Saved.");
    load();
  }

  async function runTest(id: string) {
    setTest((t) => ({ ...t, [id]: "testing…" }));
    try {
      const r = await fetch(api("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Reply with exactly: ok", only: id }),
      });
      const j = await r.json();
      setTest((t) => ({
        ...t,
        [id]: j.text
          ? `✓ ${j.text.trim().slice(0, 40)} (${j.model})`
          : `✗ ${j.tried?.map((x: { error: string }) => x.error).join("; ") || "failed"}`,
      }));
    } catch (e) {
      setTest((t) => ({ ...t, [id]: `✗ ${(e as Error).message}` }));
    }
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings · AI providers</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Free-tier providers with rotation + fallback. Keys stay on this server.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || !rows}
          className="rounded-md px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          style={{ background: "var(--ct-accent)" }}
        >
          {saving ? "Saving…" : "Save all"}
        </button>
      </header>

      {msg && (
        <p className="mb-4 text-xs" style={{ color: "var(--ct-green)" }}>{msg}</p>
      )}

      {/* Lead-finder integration keys */}
      <div className="mb-6 rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
        <div className="mb-1 font-medium">Lead finder</div>
        <p className="mb-3 text-xs" style={{ color: "var(--ct-muted)" }}>
          Firecrawl (web search + scrape) and Hunter.io (emails) power “Find leads” on the Contacts tab.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>
              Firecrawl API key {intInfo?.firecrawl.hasKey ? `(set ${intInfo.firecrawl.hint})` : "(none)"}
            </span>
            <input
              className="input"
              type="password"
              placeholder={intInfo?.firecrawl.hasKey ? "•••••• leave blank to keep" : "fc-..."}
              value={fc}
              onChange={(e) => setFc(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>
              Hunter.io API key {intInfo?.hunterio.hasKey ? `(set ${intInfo.hunterio.hint})` : "(none)"}
            </span>
            <input
              className="input"
              type="password"
              placeholder={intInfo?.hunterio.hasKey ? "•••••• leave blank to keep" : "paste key"}
              value={hio}
              onChange={(e) => setHio(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveInt} className="rounded-md px-3 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>
            Save keys
          </button>
          {intMsg && <span className="text-xs" style={{ color: "var(--ct-green)" }}>{intMsg}</span>}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--ct-muted)" }}>AI chat providers</h2>
      {!rows && <p style={{ color: "var(--ct-muted)" }}>Loading…</p>}

      <div className="flex flex-col gap-3">
        {rows?.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border p-4"
            style={{ background: "var(--ct-surface)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={(e) => update(p.id, { enabled: e.target.checked })}
                />
                {p.label}
              </label>
              <div className="flex items-center gap-3">
                {test[p.id] && (
                  <span className="text-xs" style={{ color: "var(--ct-muted)" }}>
                    {test[p.id]}
                  </span>
                )}
                <button
                  onClick={() => runTest(p.id)}
                  className="rounded border px-2 py-1 text-xs"
                  style={{ color: "var(--ct-teal)" }}
                >
                  Test
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Model</span>
                <input
                  className="input"
                  value={p.model}
                  onChange={(e) => update(p.id, { model: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>
                  API key {p.hasKey ? `(set ${p.keyHint})` : "(none)"}
                </span>
                <input
                  className="input"
                  type="password"
                  placeholder={p.hasKey ? "•••••• leave blank to keep" : "paste key"}
                  value={p.keyInput}
                  onChange={(e) => update(p.id, { keyInput: e.target.value })}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs" style={{ color: "var(--ct-muted)" }}>
        No key for any provider? The Ask tab still works via Puter (no key, runs in your browser).
      </p>

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
