"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  MILESTONE_CATEGORIES,
  type Milestone,
  type MilestoneCategory,
} from "@/lib/types";
import { fetcher, api } from "@/lib/api";

const CATEGORY_COLOR: Record<MilestoneCategory, string> = {
  Product: "var(--ct-teal)",
  Outreach: "var(--ct-accent)",
  Legal: "var(--ct-green)",
  Banking: "var(--ct-green)",
  Launch: "var(--ct-red)",
  Other: "var(--ct-muted)",
};

function emptyMilestone(): Partial<Milestone> {
  return {
    title: "",
    date: null,
    category: "Other",
    notes: "",
  };
}

export default function TimelinePage() {
  const { data: milestones, mutate } = useSWR<Milestone[]>(
    "/api/milestones",
    fetcher,
  );
  const [editing, setEditing] = useState<Partial<Milestone> | null>(null);

  const sorted = useMemo(() => {
    return [...(milestones ?? [])].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? -1 : 1;
    });
  }, [milestones]);

  async function toggleDone(m: Milestone) {
    await fetch(api(`/api/milestones/${m.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !m.done }),
    });
    mutate();
  }

  async function save() {
    if (!editing) return;
    if (editing.id) {
      await fetch(api(`/api/milestones/${editing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    } else {
      await fetch(api("/api/milestones"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    }
    setEditing(null);
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this milestone?")) return;
    await fetch(api(`/api/milestones/${id}`), { method: "DELETE" });
    setEditing(null);
    mutate();
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timeline &amp; Milestones</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Releases, outreach, legal and banking steps in order.
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyMilestone())}
          className="rounded-md px-3 py-2 text-sm font-medium text-black"
          style={{ background: "var(--ct-accent)" }}
        >
          + Add milestone
        </button>
      </header>

      {sorted.length === 0 && (
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          No milestones yet.
        </p>
      )}

      {sorted.length > 0 && (
        <div className="relative pl-6">
          {/* Vertical guide line */}
          <div
            className="absolute bottom-2 left-[7px] top-2 w-px"
            style={{ background: "var(--ct-border)" }}
          />
          <div className="flex flex-col gap-5">
            {sorted.map((m) => (
              <div key={m.id} className="relative flex items-start gap-3">
                {/* Marker dot */}
                <div
                  className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full ring-2"
                  style={{
                    background: m.done
                      ? "var(--ct-surface-2)"
                      : CATEGORY_COLOR[m.category],
                    boxShadow: "0 0 0 3px var(--ct-bg)",
                    borderColor: CATEGORY_COLOR[m.category],
                  }}
                />
                <div className="w-24 shrink-0 pt-0.5 text-xs tabular-nums" style={{ color: "var(--ct-muted)" }}>
                  {m.date ?? "—"}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={
                        m.done
                          ? {
                              textDecoration: "line-through",
                              color: "var(--ct-muted)",
                            }
                          : undefined
                      }
                    >
                      {m.title}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[0.65rem] font-medium"
                      style={{
                        background: "var(--ct-surface-2)",
                        color: CATEGORY_COLOR[m.category],
                      }}
                    >
                      {m.category}
                    </span>
                  </div>
                  {m.notes && (
                    <div className="mt-0.5 text-xs" style={{ color: "var(--ct-muted)" }}>
                      {m.notes}
                    </div>
                  )}
                  <div className="mt-1.5 flex gap-3">
                    <button
                      onClick={() => toggleDone(m)}
                      className="text-xs"
                      style={{ color: "var(--ct-green)" }}
                    >
                      {m.done ? "Reopen" : "Done"}
                    </button>
                    <button
                      onClick={() => setEditing({ ...m })}
                      className="text-xs"
                      style={{ color: "var(--ct-teal)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(m.id)}
                      className="text-xs"
                      style={{ color: "var(--ct-red)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l p-6"
            style={{ background: "var(--ct-surface)" }}
          >
            <h2 className="mb-4 text-lg font-bold">
              {editing.id ? "Edit milestone" : "New milestone"}
            </h2>
            <div className="flex flex-col gap-4">
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Title</span>
                <input
                  className="input"
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Date</span>
                <input
                  type="date"
                  className="input"
                  value={editing.date ?? ""}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value || null })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Category</span>
                <select
                  className="input"
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value as MilestoneCategory })
                  }
                >
                  {MILESTONE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Notes</span>
                <textarea
                  className="input min-h-24"
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </label>
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
