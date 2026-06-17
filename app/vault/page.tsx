"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { DOC_TYPES, type DocumentItem, type DocType } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function emptyDoc(): Partial<DocumentItem> {
  return {
    title: "",
    type: "Other",
    location: "",
    tags: [],
    notes: "",
  };
}

export default function VaultPage() {
  const { data: documents, mutate, isLoading } = useSWR<DocumentItem[]>(
    "/api/documents",
    fetcher,
  );
  const [editing, setEditing] = useState<Partial<DocumentItem> | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    (documents ?? []).forEach((d) => d.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (documents ?? []).filter((d) => {
      if (activeTag && !d.tags.includes(activeTag)) return false;
      if (!q) return true;
      const haystack = [
        d.title,
        d.type,
        d.notes,
        d.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [documents, search, activeTag]);

  function openAdd() {
    setEditing(emptyDoc());
    setTagsInput("");
  }

  function openEdit(d: DocumentItem) {
    setEditing({ ...d });
    setTagsInput(d.tags.join(", "));
  }

  function close() {
    setEditing(null);
    setTagsInput("");
  }

  async function save() {
    if (!editing) return;
    const payload = {
      title: editing.title,
      type: editing.type,
      location: editing.location,
      tags: tagsInput,
      notes: editing.notes,
    };
    if (editing.id) {
      await fetch(`/api/documents/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    close();
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    close();
    mutate();
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Vault</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Tag-searchable references — IM, one-pagers, contracts, NDAs.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-md px-3 py-2 text-sm font-medium text-black"
          style={{ background: "var(--ct-accent)" }}
        >
          + Add document
        </button>
      </header>

      {/* Search + tag filters */}
      <div className="mb-6 flex flex-col gap-3">
        <input
          className="input"
          placeholder="Search title, tags, notes, type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className="rounded-full px-3 py-1 text-xs"
              style={{
                background: activeTag === null ? "var(--ct-accent)" : "var(--ct-surface-2)",
                color: activeTag === null ? "#000" : "var(--ct-muted)",
                border: "1px solid var(--ct-border)",
              }}
            >
              All
            </button>
            {allTags.map((t) => {
              const active = activeTag === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTag(active ? null : t)}
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: active ? "var(--ct-teal)" : "var(--ct-surface-2)",
                    color: active ? "#000" : "var(--ct-muted)",
                    border: "1px solid var(--ct-border)",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {isLoading && (
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Loading…
          </p>
        )}
        {!isLoading && (documents?.length ?? 0) === 0 && (
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            No documents yet.
          </p>
        )}
        {!isLoading &&
          (documents?.length ?? 0) > 0 &&
          filtered.length === 0 && (
            <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
              No documents match your filters.
            </p>
          )}
        {filtered.map((d) => (
          <div
            key={d.id}
            className="rounded-lg border p-4"
            style={{ background: "var(--ct-surface)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold">{d.title}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-black"
                  style={{ background: "var(--ct-teal)" }}
                >
                  {d.type}
                </span>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  onClick={() => openEdit(d)}
                  className="text-xs"
                  style={{ color: "var(--ct-muted)" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(d.id)}
                  className="text-xs"
                  style={{ color: "var(--ct-red)" }}
                >
                  Delete
                </button>
              </div>
            </div>

            {d.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {d.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      background: "var(--ct-surface-2)",
                      color: "var(--ct-muted)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {d.notes && (
              <p className="mt-2 text-sm" style={{ color: "var(--ct-muted)" }}>
                {d.notes}
              </p>
            )}

            {d.location && (
              <div className="mt-3 text-sm">
                {d.location.startsWith("http") ? (
                  <a
                    href={d.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--ct-teal)" }}
                    className="break-all hover:underline"
                  >
                    {d.location}
                  </a>
                ) : (
                  <div className="flex items-center gap-2">
                    <code
                      className="break-all font-mono text-xs"
                      style={{ color: "var(--ct-muted)" }}
                    >
                      {d.location}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(d.location)}
                      className="shrink-0 rounded border px-2 py-0.5 text-xs"
                      style={{ color: "var(--ct-muted)" }}
                    >
                      Copy path
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l p-6"
            style={{ background: "var(--ct-surface)" }}
          >
            <h2 className="mb-4 text-lg font-bold">
              {editing.id ? "Edit document" : "New document"}
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Title">
                <input
                  className="input"
                  value={editing.title ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </Field>
              <Field label="Type">
                <select
                  className="input"
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({ ...editing, type: e.target.value as DocType })
                  }
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <input
                  className="input"
                  placeholder="file path or https URL"
                  value={editing.location ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, location: e.target.value })
                  }
                />
              </Field>
              <Field label="Tags">
                <input
                  className="input"
                  placeholder="comma, separated, tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className="input min-h-24"
                  value={editing.notes ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
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
                onClick={close}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
