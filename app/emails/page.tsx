"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { EmailTemplate } from "@/lib/types";

const CATEGORIES = ["Product", "Sales", "Marketing", "Other"];

function empty(): Partial<EmailTemplate> {
  return { title: "", category: "Sales", body: "", tags: [] };
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailTemplate[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<EmailTemplate> | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(api("/api/emails"));
    setEmails(await r.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload = {
      title: editing.title,
      category: editing.category,
      body: editing.body,
      tags: editing.tags,
    };
    if (editing.id) {
      await fetch(api(`/api/emails/${editing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(api("/api/emails"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, source: "manual" }),
      });
    }
    setEditing(null);
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this email?")) return;
    await fetch(api(`/api/emails/${id}`), { method: "DELETE" });
    setEditing(null);
    load();
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return emails;
    const t = q.toLowerCase();
    return emails.filter((e) =>
      [e.title, e.category, e.body, e.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [emails, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, EmailTemplate[]>();
    for (const e of filtered) {
      const k = e.category || "Other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return Array.from(m.entries());
  }, [filtered]);

  return (
    <div className="max-w-4xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach Emails</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Your email sequences &amp; templates — edit them right here, saved instantly.
          </p>
        </div>
        <button
          onClick={() => setEditing(empty())}
          className="rounded-md px-3 py-2 text-sm font-medium text-black"
          style={{ background: "var(--ct-accent)" }}
        >
          + New email
        </button>
      </header>

      <input
        className="input mb-4 max-w-sm"
        placeholder="Search emails…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {emails.length === 0 && (
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          No emails yet.
        </p>
      )}

      {grouped.map(([cat, items]) => (
        <section key={cat} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--ct-muted)" }}>
            {cat} · {items.length}
          </h2>
          <div className="flex flex-col gap-3">
            {items.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border p-4"
                style={{ background: "var(--ct-surface)" }}
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <button
                    className="text-left font-medium hover:underline"
                    onClick={() => setEditing({ ...e })}
                  >
                    {e.title}
                  </button>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--ct-muted)" }}>{e.source}</span>
                    <button onClick={() => setEditing({ ...e })} className="text-xs" style={{ color: "var(--ct-teal)" }}>Edit</button>
                    <button onClick={() => remove(e.id)} className="text-xs" style={{ color: "var(--ct-red)" }}>Delete</button>
                  </div>
                </div>
                <div
                  className="line-clamp-3 whitespace-pre-wrap text-sm"
                  style={{ color: "var(--ct-muted)" }}
                >
                  {e.body.slice(0, 280)}
                  {e.body.length > 280 ? "…" : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-4 text-lg font-bold">{editing.id ? "Edit email" : "New email"}</h2>
            <label className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Title</label>
            <input
              className="input mb-3"
              value={editing.title ?? ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <label className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Category</label>
            <select
              className="input mb-3"
              value={editing.category ?? "Sales"}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Email body / sequence</label>
            <textarea
              className="input mb-3 min-h-[28rem] font-mono text-xs"
              value={editing.body ?? ""}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            />
            <label className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Tags (comma-separated)</label>
            <input
              className="input mb-4"
              value={(editing.tags ?? []).join(", ")}
              onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="rounded-md px-4 py-2 text-sm font-medium text-black disabled:opacity-50" style={{ background: "var(--ct-accent)" }}>
                {busy ? "Saving…" : "Save"}
              </button>
              {editing.id && (
                <button onClick={() => remove(editing.id!)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-red)" }}>Delete</button>
              )}
              <button onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-muted)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input { width: 100%; border-radius: 0.375rem; border: 1px solid var(--ct-border); background: var(--ct-surface-2); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--ct-text); }
      `}</style>
    </div>
  );
}
