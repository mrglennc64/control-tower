"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  TASK_COLUMNS,
  TASK_PRIORITIES,
  type Task,
  type TaskColumn,
  type TaskPriority,
} from "@/lib/types";
import { fetcher, api } from "@/lib/api";

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  High: "var(--ct-red)",
  Medium: "var(--ct-accent)",
  Low: "var(--ct-muted)",
};

function emptyTask(): Partial<Task> {
  return {
    title: "",
    component: "",
    priority: "Medium",
    estimate: "",
    dependencies: "",
    repo: "",
    column: "Backlog",
    notes: "",
  };
}

export default function WorkboardPage() {
  const { data: tasks, mutate } = useSWR<Task[]>("/api/tasks", fetcher);
  const [editing, setEditing] = useState<Partial<Task> | null>(null);

  async function moveCard(id: string, column: TaskColumn) {
    await fetch(api(`/api/tasks/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column }),
    });
    mutate();
  }

  async function save() {
    if (!editing) return;
    if (editing.id) {
      await fetch(api(`/api/tasks/${editing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    } else {
      await fetch(api("/api/tasks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    }
    setEditing(null);
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this card?")) return;
    await fetch(api(`/api/tasks/${id}`), { method: "DELETE" });
    setEditing(null);
    mutate();
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Engineering Workboard</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Kanban across your builds.
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyTask())}
          className="rounded-md px-3 py-2 text-sm font-medium text-black"
          style={{ background: "var(--ct-accent)" }}
        >
          + Add card
        </button>
      </header>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {TASK_COLUMNS.map((col) => {
          const cards = (tasks ?? []).filter((t) => t.column === col);
          return (
            <div
              key={col}
              className="flex min-w-[240px] flex-1 flex-col rounded-lg p-3"
              style={{ background: "var(--ct-surface)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{col}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs tabular-nums"
                  style={{ background: "var(--ct-surface-2)", color: "var(--ct-muted)" }}
                >
                  {cards.length}
                </span>
              </div>

              {cards.length === 0 && (
                <div className="text-sm" style={{ color: "var(--ct-muted)" }}>
                  —
                </div>
              )}

              {cards.map((t) => (
                <div
                  key={t.id}
                  className="mb-2 rounded-md p-3"
                  style={{ background: "var(--ct-surface-2)" }}
                >
                  <button
                    className="mb-2 block text-left text-sm font-medium hover:underline"
                    onClick={() => setEditing({ ...t })}
                  >
                    {t.title}
                  </button>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        t.priority === "Low" ? "" : "text-black"
                      }`}
                      style={{ background: PRIORITY_COLOR[t.priority] }}
                    >
                      {t.priority}
                    </span>
                  </div>
                  {t.component && (
                    <div className="text-xs" style={{ color: "var(--ct-muted)" }}>
                      {t.component}
                    </div>
                  )}
                  {t.estimate && (
                    <div className="text-xs" style={{ color: "var(--ct-muted)" }}>
                      {t.estimate}
                    </div>
                  )}
                  <select
                    value={t.column}
                    onChange={(e) => moveCard(t.id, e.target.value as TaskColumn)}
                    className="mt-2 w-full rounded border px-2 py-1 text-xs"
                    style={{ background: "var(--ct-surface)", color: "var(--ct-text)" }}
                  >
                    {TASK_COLUMNS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Add / edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l p-6"
            style={{ background: "var(--ct-surface)" }}
          >
            <h2 className="mb-4 text-lg font-bold">
              {editing.id ? "Edit card" : "New card"}
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Title">
                <input
                  className="input"
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </Field>
              <Field label="Component">
                <input
                  className="input"
                  value={editing.component ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, component: e.target.value })
                  }
                />
              </Field>
              <Field label="Priority">
                <select
                  className="input"
                  value={editing.priority}
                  onChange={(e) =>
                    setEditing({ ...editing, priority: e.target.value as TaskPriority })
                  }
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estimate">
                <input
                  className="input"
                  value={editing.estimate ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, estimate: e.target.value })
                  }
                />
              </Field>
              <Field label="Dependencies">
                <input
                  className="input"
                  value={editing.dependencies ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, dependencies: e.target.value })
                  }
                />
              </Field>
              <Field label="Repo">
                <input
                  className="input"
                  value={editing.repo ?? ""}
                  onChange={(e) => setEditing({ ...editing, repo: e.target.value })}
                />
              </Field>
              <Field label="Column">
                <select
                  className="input"
                  value={editing.column}
                  onChange={(e) =>
                    setEditing({ ...editing, column: e.target.value as TaskColumn })
                  }
                >
                  {TASK_COLUMNS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notes">
                <textarea
                  className="input min-h-24"
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </Field>
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
              {editing.id && (
                <button
                  onClick={() => remove(editing.id!)}
                  className="ml-auto rounded-md border px-4 py-2 text-sm"
                  style={{ color: "var(--ct-red)" }}
                >
                  Delete
                </button>
              )}
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
