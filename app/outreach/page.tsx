"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { STAGES, CATEGORIES, type Buyer, type Stage } from "@/lib/types";
import { fetcher, api } from "@/lib/api";

const STAGE_COLOR: Record<Stage, string> = {
  "Not contacted": "var(--ct-muted)",
  Contacted: "var(--ct-teal)",
  Replied: "var(--ct-teal)",
  NDA: "var(--ct-accent)",
  "Tech review": "var(--ct-accent)",
  Offer: "var(--ct-green)",
  "Closed/Passed": "var(--ct-muted)",
};

function emptyBuyer(): Partial<Buyer> {
  return {
    name: "",
    category: "strategic",
    fitScore: 3,
    stage: "Not contacted",
    nextAction: "",
    nextActionDate: null,
    lastActivity: null,
    notes: "",
  };
}

export default function OutreachPage() {
  const { data: buyers, mutate, isLoading } = useSWR<Buyer[]>(
    "/api/buyers",
    fetcher,
  );
  const [editing, setEditing] = useState<Partial<Buyer> | null>(null);
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftVia, setDraftVia] = useState("");

  const counts = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
      Stage,
      number
    >;
    (buyers ?? []).forEach((b) => {
      map[b.stage] = (map[b.stage] ?? 0) + 1;
    });
    return map;
  }, [buyers]);

  const maxCount = Math.max(1, ...Object.values(counts));

  async function quickStage(id: string, stage: Stage) {
    await fetch(api(`/api/buyers/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, lastActivity: new Date().toISOString().slice(0, 10) }),
    });
    mutate();
  }

  async function save() {
    if (!editing) return;
    if (editing.id) {
      await fetch(api(`/api/buyers/${editing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    } else {
      await fetch(api("/api/buyers"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    }
    setEditing(null);
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this buyer?")) return;
    await fetch(api(`/api/buyers/${id}`), { method: "DELETE" });
    setEditing(null);
    mutate();
  }

  async function draftOutreach() {
    if (!editing) return;
    setDrafting(true);
    setDraft("");
    setDraftVia("");
    try {
      const r = await fetch(api("/api/ai/draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: editing.name,
            company: editing.category,
            tags: [editing.stage, editing.category].filter(Boolean),
            notes: [editing.notes, editing.nextAction && `Next: ${editing.nextAction}`]
              .filter(Boolean)
              .join(". "),
          },
          context:
            "This is a prospective ACQUIRER for a business/product we are selling (NgineAgent). " +
            `They are currently at pipeline stage "${editing.stage}". ` +
            "Draft a short outreach to move the conversation forward toward the acquisition.",
        }),
      });
      const j = await r.json();
      if (j.text) {
        setDraft(j.text);
        setDraftVia(`${j.provider} · ${j.model}`);
      } else {
        setDraft("Couldn't draft — all providers failed. Add a key in Settings or use the Ask tab.");
      }
    } catch (e) {
      setDraft(`Error: ${(e as Error).message}`);
    }
    setDrafting(false);
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Acquisition Outreach</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            NgineAgent sale pipeline · {buyers?.length ?? 0} buyers
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={api("/api/export?format=csv")}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ color: "var(--ct-muted)" }}
          >
            Export CSV
          </a>
          <a
            href={api("/api/export?format=json")}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ color: "var(--ct-muted)" }}
          >
            Export JSON
          </a>
          <button
            onClick={() => { setEditing(emptyBuyer()); setDraft(""); setDraftVia(""); }}
            className="rounded-md px-3 py-2 text-sm font-medium text-black"
            style={{ background: "var(--ct-accent)" }}
          >
            + Add buyer
          </button>
        </div>
      </header>

      {/* Funnel */}
      <section
        className="mb-8 rounded-lg border p-4"
        style={{ background: "var(--ct-surface)" }}
      >
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--ct-muted)" }}>
          Pipeline funnel
        </h2>
        <div className="flex flex-col gap-2">
          {STAGES.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-xs" style={{ color: "var(--ct-muted)" }}>
                {s}
              </div>
              <div className="h-5 flex-1 overflow-hidden rounded" style={{ background: "var(--ct-surface-2)" }}>
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(counts[s] / maxCount) * 100}%`,
                    background: STAGE_COLOR[s],
                    minWidth: counts[s] > 0 ? "1.5rem" : 0,
                  }}
                />
              </div>
              <div className="w-6 text-right text-sm tabular-nums">{counts[s]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Table */}
      <section
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--ct-surface)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ color: "var(--ct-muted)" }}>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Fit</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Next action</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>
                  Loading…
                </td>
              </tr>
            )}
            {buyers?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>
                  No buyers yet. Click “Add buyer”.
                </td>
              </tr>
            )}
            {buyers?.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <button
                    className="font-medium hover:underline"
                    onClick={() => { setEditing({ ...b }); setDraft(""); setDraftVia(""); }}
                  >
                    {b.name}
                  </button>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>
                  {b.category}
                </td>
                <td className="px-4 py-3 tabular-nums">{"★".repeat(b.fitScore)}</td>
                <td className="px-4 py-3">
                  <select
                    value={b.stage}
                    onChange={(e) => quickStage(b.id, e.target.value as Stage)}
                    className="rounded border bg-transparent px-2 py-1 text-xs"
                    style={{ background: "var(--ct-surface-2)" }}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">{b.nextAction || "—"}</td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>
                  {b.nextActionDate || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(b.id)}
                    className="text-xs"
                    style={{ color: "var(--ct-red)" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l p-6"
            style={{ background: "var(--ct-surface)" }}
          >
            <h2 className="mb-4 text-lg font-bold">
              {editing.id ? "Edit buyer" : "New buyer"}
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Name">
                <input
                  className="input"
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </Field>
              <Field label="Category">
                <select
                  className="input"
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value as Buyer["category"] })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Fit score (${editing.fitScore})`}>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={editing.fitScore ?? 3}
                  onChange={(e) =>
                    setEditing({ ...editing, fitScore: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Stage">
                <select
                  className="input"
                  value={editing.stage}
                  onChange={(e) =>
                    setEditing({ ...editing, stage: e.target.value as Stage })
                  }
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Next action">
                <input
                  className="input"
                  value={editing.nextAction ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, nextAction: e.target.value })
                  }
                />
              </Field>
              <Field label="Next action date">
                <input
                  type="date"
                  className="input"
                  value={editing.nextActionDate ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, nextActionDate: e.target.value || null })
                  }
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className="input min-h-24"
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </Field>

              <div className="rounded-md border p-3" style={{ background: "var(--ct-surface-2)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "var(--ct-muted)" }}>AI outreach draft</span>
                  <button
                    onClick={draftOutreach}
                    disabled={drafting}
                    className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                    style={{ color: "var(--ct-teal)" }}
                  >
                    {drafting ? "Drafting…" : "Draft outreach"}
                  </button>
                </div>
                {draft && (
                  <>
                    <textarea
                      className="input min-h-28"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <button onClick={() => navigator.clipboard.writeText(draft)} className="text-xs" style={{ color: "var(--ct-teal)" }}>Copy</button>
                      <button
                        onClick={() => setEditing({ ...editing, notes: `${editing.notes ? editing.notes + "\n\n" : ""}--- Draft ---\n${draft}` })}
                        className="text-xs"
                        style={{ color: "var(--ct-teal)" }}
                      >
                        Append to notes
                      </button>
                      {draftVia && <span className="text-xs" style={{ color: "var(--ct-muted)" }}>via {draftVia}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={save}
                className="rounded-md px-4 py-2 text-sm font-medium text-black"
                style={{ background: "var(--ct-accent)" }}
              >
                Save
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-md border px-4 py-2 text-sm"
                style={{ color: "var(--ct-muted)" }}
              >
                Cancel
              </button>
            </div>
          </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
