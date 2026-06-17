"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { StrategyNote } from "@/lib/types";

export default function StrategyPage() {
  const [notes, setNotes] = useState<StrategyNote[]>([]);
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [editing, setEditing] = useState<StrategyNote | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch(api("/api/strategy"));
    setNotes(await r.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!content.trim() && !title.trim()) return;
    setBusy(true);
    await fetch(api("/api/strategy"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || content.slice(0, 50),
        content,
        tags,
        source: "paste",
      }),
    });
    setTitle("");
    setContent("");
    setTags("");
    setBusy(false);
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    await fetch(api(`/api/strategy/${editing.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editing.title,
        content: editing.content,
        tags: editing.tags,
      }),
    });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this note?")) return;
    await fetch(api(`/api/strategy/${id}`), { method: "DELETE" });
    setEditing(null);
    load();
  }

  async function synthesize() {
    setBusy(true);
    setMsg("Synthesizing strategy from your notes…");
    try {
      const r = await fetch(api("/api/strategy/synthesize"), { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setMsg(`Synthesized (via ${j.provider}).`);
    } catch (e) {
      setMsg(`Synthesis failed: ${(e as Error).message}`);
    }
    setBusy(false);
    load();
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return notes;
    const t = q.toLowerCase();
    return notes.filter((n) =>
      [n.title, n.content, n.tags.join(" ")].join(" ").toLowerCase().includes(t),
    );
  }, [notes, q]);

  return (
    <div className="max-w-4xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategy</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Your growing playbook. Paste notes or save from Chat — then synthesize.
          </p>
        </div>
        <button
          onClick={synthesize}
          disabled={busy}
          className="rounded-md px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          style={{ background: "var(--ct-accent)" }}
        >
          {busy ? "Working…" : "Synthesize (AI)"}
        </button>
      </header>

      {/* Add note */}
      <section className="mb-6 rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
        <div className="mb-2 text-sm font-semibold" style={{ color: "var(--ct-muted)" }}>Add to strategy</div>
        <input className="input mb-2" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input mb-2 min-h-28" placeholder="Paste a strategy, idea, plan, or insight…" value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex items-center gap-2">
          <input className="input max-w-xs" placeholder="tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <button onClick={add} disabled={busy} className="rounded-md px-3 py-2 text-sm font-medium text-black disabled:opacity-50" style={{ background: "var(--ct-accent)" }}>Add</button>
          {msg && <span className="text-xs" style={{ color: "var(--ct-muted)" }}>{msg}</span>}
        </div>
      </section>

      <input className="input mb-4 max-w-sm" placeholder="Search strategy…" value={q} onChange={(e) => setQ(e.target.value)} />

      {filtered.length === 0 && (
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          Nothing yet. Paste a note above, or use “Save to Strategy” in Chat.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className="rounded-lg border p-4"
            style={{
              background: "var(--ct-surface)",
              borderColor: n.pinned ? "var(--ct-accent)" : "var(--ct-border)",
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="font-medium">{n.title}</div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--ct-muted)" }}>{n.source}</span>
                <button onClick={() => setEditing({ ...n })} className="text-xs" style={{ color: "var(--ct-teal)" }}>Edit</button>
                <button onClick={() => remove(n.id)} className="text-xs" style={{ color: "var(--ct-red)" }}>Delete</button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm" style={{ color: "var(--ct-text)" }}>{n.content}</div>
            {n.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {n.tags.map((t) => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--ct-surface-2)", color: "var(--ct-muted)" }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-4 text-lg font-bold">Edit note</h2>
            <label className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Title</label>
            <input className="input mb-3" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <label className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Content</label>
            <textarea className="input mb-3 min-h-64" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            <label className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Tags (comma-separated)</label>
            <input className="input mb-4" value={editing.tags.join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="rounded-md px-4 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>Save</button>
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
