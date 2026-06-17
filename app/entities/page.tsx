"use client";

import { useState } from "react";
import useSWR from "swr";
import { ENTITY_STATUS, type Entity, type EntityStatus } from "@/lib/types";
import { fetcher, api } from "@/lib/api";

const STATUS_COLOR: Record<EntityStatus, string> = {
  Active: "var(--ct-green)",
  Planned: "var(--ct-teal)",
  Dormant: "var(--ct-muted)",
  Closed: "var(--ct-muted)",
};

function emptyEntity(): Partial<Entity> {
  return {
    name: "",
    entityType: "",
    jurisdiction: "",
    purpose: "",
    ownership: "",
    assets: "",
    status: "Active",
    nextFilingDate: null,
    notes: "",
  };
}

export default function EntitiesPage() {
  const { data: entities, mutate, isLoading } = useSWR<Entity[]>(
    "/api/entities",
    fetcher,
  );
  const [editing, setEditing] = useState<Partial<Entity> | null>(null);

  async function save() {
    if (!editing) return;
    if (editing.id) {
      await fetch(api(`/api/entities/${editing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    } else {
      await fetch(api("/api/entities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
    }
    setEditing(null);
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this entity?")) return;
    await fetch(api(`/api/entities/${id}`), { method: "DELETE" });
    setEditing(null);
    mutate();
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Entities</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Your legal structure at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(emptyEntity())}
            className="rounded-md px-3 py-2 text-sm font-medium text-black"
            style={{ background: "var(--ct-accent)" }}
          >
            + Add entity
          </button>
        </div>
      </header>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          Loading…
        </p>
      )}
      {entities?.length === 0 && !isLoading && (
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          No entities yet. Click “Add entity”.
        </p>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {entities?.map((e) => (
          <div
            key={e.id}
            className="rounded-lg border p-4"
            style={{ background: "var(--ct-surface)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold">{e.name}</div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-black"
                style={{ background: STATUS_COLOR[e.status] }}
              >
                {e.status}
              </span>
            </div>
            <div className="mt-1 text-sm" style={{ color: "var(--ct-muted)" }}>
              {e.entityType} · {e.jurisdiction}
            </div>
            {e.purpose && <p className="mt-2 text-sm">{e.purpose}</p>}
            <div className="mt-3 flex flex-col gap-1 text-xs" style={{ color: "var(--ct-muted)" }}>
              <div>Ownership: {e.ownership || "—"}</div>
              <div>Assets: {e.assets || "—"}</div>
              <div>Next filing: {e.nextFilingDate || "—"}</div>
            </div>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => setEditing({ ...e })}
                className="text-xs hover:underline"
                style={{ color: "var(--ct-accent)" }}
              >
                Edit
              </button>
              <button
                onClick={() => remove(e.id)}
                className="text-xs hover:underline"
                style={{ color: "var(--ct-red)" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l p-6"
            style={{ background: "var(--ct-surface)" }}
          >
            <h2 className="mb-4 text-lg font-bold">
              {editing.id ? "Edit entity" : "New entity"}
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Name">
                <input
                  className="input"
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </Field>
              <Field label="Entity type">
                <input
                  className="input"
                  placeholder="e.g. AB, LLC"
                  value={editing.entityType ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, entityType: e.target.value })
                  }
                />
              </Field>
              <Field label="Jurisdiction">
                <input
                  className="input"
                  value={editing.jurisdiction ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, jurisdiction: e.target.value })
                  }
                />
              </Field>
              <Field label="Purpose">
                <input
                  className="input"
                  value={editing.purpose ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, purpose: e.target.value })
                  }
                />
              </Field>
              <Field label="Ownership">
                <input
                  className="input"
                  value={editing.ownership ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, ownership: e.target.value })
                  }
                />
              </Field>
              <Field label="Assets">
                <input
                  className="input"
                  value={editing.assets ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, assets: e.target.value })
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  className="input"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as EntityStatus })
                  }
                >
                  {ENTITY_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Next filing date">
                <input
                  type="date"
                  className="input"
                  value={editing.nextFilingDate ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, nextFilingDate: e.target.value || null })
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
