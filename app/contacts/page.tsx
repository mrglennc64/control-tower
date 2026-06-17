"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher, api } from "@/lib/api";
import { parseCsv } from "@/lib/csv";
import { CONTACT_FIELDS, type Contact, type ContactField } from "@/lib/types";

const SYNONYMS: Record<ContactField, string[]> = {
  name: ["name", "full name", "fullname", "contact", "artist"],
  email: ["email", "e-mail", "mail"],
  company: ["company", "organization", "org", "label", "publisher"],
  phone: ["phone", "tel", "telephone", "mobile", "number"],
  tags: ["tags", "tag", "category", "source", "chart", "list"],
  notes: ["notes", "note", "comment", "comments", "track", "description"],
};

function autoMap(headers: string[]): Record<ContactField, number> {
  const lc = headers.map((h) => h.trim().toLowerCase());
  const m = {} as Record<ContactField, number>;
  for (const f of CONTACT_FIELDS) {
    m[f] = lc.findIndex((h) => SYNONYMS[f].includes(h));
  }
  return m;
}

function emptyContact(): Partial<Contact> {
  return { name: "", email: "", company: "", phone: "", tags: [], notes: "" };
}

export default function ContactsPage() {
  const { data: contacts, mutate, isLoading } = useSWR<Contact[]>(
    "/api/contacts",
    fetcher,
  );
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  const [tagsText, setTagsText] = useState("");

  // CSV import state
  const [csvOpen, setCsvOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<ContactField, number>>(
    {} as Record<ContactField, number>,
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const filtered = useMemo(() => {
    const list = contacts ?? [];
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter((c) =>
      [c.name, c.email, c.company, c.phone, c.notes, c.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [contacts, q]);

  async function saveContact() {
    if (!editing) return;
    const payload = { ...editing, tags: tagsText };
    if (editing.id) {
      await fetch(api(`/api/contacts/${editing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(api("/api/contacts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setEditing(null);
    mutate();
  }

  async function removeContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    await fetch(api(`/api/contacts/${id}`), { method: "DELETE" });
    setEditing(null);
    mutate();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 1) {
      setMsg("Empty CSV.");
      return;
    }
    setFileName(file.name);
    setHeaders(rows[0]);
    setDataRows(rows.slice(1));
    setMapping(autoMap(rows[0]));
    setMsg("");
  }

  async function runImport() {
    if (mapping.name == null || mapping.name < 0) {
      setMsg("Map the Name column first — it's required.");
      return;
    }
    setBusy(true);
    const pick = (row: string[], i: number) =>
      i != null && i >= 0 ? (row[i] ?? "") : "";
    const rows = dataRows.map((row) => ({
      name: pick(row, mapping.name),
      email: pick(row, mapping.email),
      company: pick(row, mapping.company),
      phone: pick(row, mapping.phone),
      tags: pick(row, mapping.tags),
      notes: pick(row, mapping.notes),
    }));
    const res = await fetch(api("/api/contacts/import"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: rows }),
    });
    const out = await res.json();
    setBusy(false);
    setCsvOpen(false);
    setHeaders([]);
    setDataRows([]);
    setFileName("");
    setMsg(`Imported ${out.added ?? 0} contacts.`);
    mutate();
  }

  async function pullHunter() {
    setBusy(true);
    setMsg("Pulling leads from Hunter…");
    try {
      const res = await fetch(api("/api/contacts/import-hunter"), {
        method: "POST",
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "failed");
      setMsg(
        `Hunter: added ${out.added} leads from ${out.files?.length ?? 0} file(s).`,
      );
    } catch (err) {
      setMsg(`Hunter import failed: ${(err as Error).message}`);
    }
    setBusy(false);
    mutate();
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            {contacts?.length ?? 0} contacts · CSV import + Hunter leads
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={pullHunter}
            disabled={busy}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            style={{ color: "var(--ct-teal)" }}
          >
            Pull from Hunter
          </button>
          <button
            onClick={() => {
              setCsvOpen(true);
              setMsg("");
            }}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ color: "var(--ct-muted)" }}
          >
            Import CSV
          </button>
          <a
            href={api("/api/contacts/export?format=smartlead")}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ color: "var(--ct-muted)" }}
          >
            Export → Smartlead
          </a>
          <a
            href={api("/api/contacts/export")}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ color: "var(--ct-muted)" }}
          >
            Export CSV
          </a>
          <button
            onClick={() => {
              setEditing(emptyContact());
              setTagsText("");
            }}
            className="rounded-md px-3 py-2 text-sm font-medium text-black"
            style={{ background: "var(--ct-accent)" }}
          >
            + Add contact
          </button>
        </div>
      </header>

      <div className="mb-4 flex items-center gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search name, email, company, tags…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {msg && (
          <span className="text-xs" style={{ color: "var(--ct-muted)" }}>
            {msg}
          </span>
        )}
      </div>

      <section
        className="overflow-x-auto rounded-lg border"
        style={{ background: "var(--ct-surface)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ color: "var(--ct-muted)" }}>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>
                  No contacts. Add one, import a CSV, or pull from Hunter.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 align-top">
                <td className="px-4 py-3">
                  <button
                    className="font-medium hover:underline"
                    onClick={() => {
                      setEditing({ ...c });
                      setTagsText(c.tags.join(", "));
                    }}
                  >
                    {c.name}
                  </button>
                  {c.notes && (
                    <div className="mt-0.5 max-w-md truncate text-xs" style={{ color: "var(--ct-muted)" }}>
                      {c.notes}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>{c.email || "—"}</td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>{c.company || "—"}</td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>{c.phone || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{ background: "var(--ct-surface-2)", color: "var(--ct-muted)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeContact(c.id)}
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

      {/* Add / edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-md overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-4 text-lg font-bold">{editing.id ? "Edit contact" : "New contact"}</h2>
            <div className="flex flex-col gap-4">
              <Field label="Name">
                <input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className="input" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </Field>
              <Field label="Company">
                <input className="input" value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className="input" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
              <Field label="Tags (comma-separated)">
                <input className="input" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
              </Field>
              <Field label="Notes">
                <textarea className="input min-h-24" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </Field>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={saveContact} className="rounded-md px-4 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>Save</button>
              {editing.id && (
                <button onClick={() => removeContact(editing.id!)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-red)" }}>Delete</button>
              )}
              <button onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-muted)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV import drawer */}
      {csvOpen && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-1 text-lg font-bold">Import contacts from CSV</h2>
            <p className="mb-4 text-xs" style={{ color: "var(--ct-muted)" }}>
              Upload any CSV, then map its columns to the fields. Name is required.
            </p>
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="mb-4 text-sm" />
            {fileName && (
              <p className="mb-3 text-xs" style={{ color: "var(--ct-muted)" }}>
                {fileName} · {dataRows.length} rows · {headers.length} columns
              </p>
            )}

            {headers.length > 0 && (
              <div className="flex flex-col gap-3">
                {CONTACT_FIELDS.map((f) => (
                  <label key={f} className="flex items-center justify-between gap-3">
                    <span className="text-sm capitalize">
                      {f}
                      {f === "name" && <span style={{ color: "var(--ct-red)" }}> *</span>}
                    </span>
                    <select
                      className="input max-w-[60%]"
                      value={mapping[f] ?? -1}
                      onChange={(e) => setMapping({ ...mapping, [f]: Number(e.target.value) })}
                    >
                      <option value={-1}>— none —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h || `(column ${i + 1})`}</option>
                      ))}
                    </select>
                  </label>
                ))}

                {dataRows[0] && mapping.name >= 0 && (
                  <div className="mt-2 rounded border p-3 text-xs" style={{ background: "var(--ct-surface-2)", color: "var(--ct-muted)" }}>
                    <div className="mb-1 font-medium">Preview (first row):</div>
                    {CONTACT_FIELDS.filter((f) => mapping[f] >= 0).map((f) => (
                      <div key={f}>
                        <span className="capitalize">{f}</span>: {dataRows[0][mapping[f]] || "—"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button onClick={runImport} disabled={busy || headers.length === 0} className="rounded-md px-4 py-2 text-sm font-medium text-black disabled:opacity-50" style={{ background: "var(--ct-accent)" }}>
                {busy ? "Importing…" : `Import ${dataRows.length} rows`}
              </button>
              <button onClick={() => { setCsvOpen(false); setHeaders([]); setDataRows([]); setFileName(""); }} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-muted)" }}>Cancel</button>
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
      <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>{label}</span>
      {children}
    </label>
  );
}
