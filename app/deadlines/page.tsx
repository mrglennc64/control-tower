"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  REMINDER_TYPES,
  type Buyer,
  type Reminder,
  type ReminderType,
} from "@/lib/types";
import { fetcher, api } from "@/lib/api";

type Item = {
  key: string;
  source: "Outreach" | "Reminder";
  title: string;
  sub: string;
  dueDate: string | null;
  href?: string;
  reminderId?: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const BUCKETS = ["Overdue", "Today", "This week", "Later", "No date"] as const;
type Bucket = (typeof BUCKETS)[number];

function bucketFor(due: string | null, today: string): Bucket {
  if (!due) return "No date";
  if (due < today) return "Overdue";
  if (due === today) return "Today";
  if (due <= addDays(today, 7)) return "This week";
  return "Later";
}

const BUCKET_COLOR: Record<Bucket, string> = {
  Overdue: "var(--ct-red)",
  Today: "var(--ct-accent)",
  "This week": "var(--ct-teal)",
  Later: "var(--ct-muted)",
  "No date": "var(--ct-muted)",
};

export default function DeadlinesPage() {
  const { data: buyers } = useSWR<Buyer[]>("/api/buyers", fetcher);
  const { data: reminders, mutate } = useSWR<Reminder[]>(
    "/api/reminders",
    fetcher,
  );
  const [draft, setDraft] = useState<Partial<Reminder> | null>(null);
  const today = todayStr();

  const items: Item[] = useMemo(() => {
    const fromBuyers: Item[] = (buyers ?? [])
      .filter((b) => b.nextActionDate)
      .map((b) => ({
        key: `buyer-${b.id}`,
        source: "Outreach",
        title: b.nextAction || "(no action text)",
        sub: b.name,
        dueDate: b.nextActionDate,
        href: "/outreach",
      }));
    const fromReminders: Item[] = (reminders ?? [])
      .filter((r) => !r.done)
      .map((r) => ({
        key: `rem-${r.id}`,
        source: "Reminder",
        title: r.title,
        sub: r.type,
        dueDate: r.dueDate,
        reminderId: r.id,
      }));
    return [...fromBuyers, ...fromReminders].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    });
  }, [buyers, reminders]);

  const grouped = useMemo(() => {
    const g: Record<Bucket, Item[]> = {
      Overdue: [],
      Today: [],
      "This week": [],
      Later: [],
      "No date": [],
    };
    items.forEach((it) => g[bucketFor(it.dueDate, today)].push(it));
    return g;
  }, [items, today]);

  const doneReminders = (reminders ?? []).filter((r) => r.done);

  async function complete(id: string) {
    await fetch(api(`/api/reminders/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    mutate();
  }
  async function reopen(id: string) {
    await fetch(api(`/api/reminders/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: false }),
    });
    mutate();
  }
  async function remove(id: string) {
    if (!confirm("Delete this reminder?")) return;
    await fetch(api(`/api/reminders/${id}`), { method: "DELETE" });
    mutate();
  }
  async function saveDraft() {
    if (!draft) return;
    await fetch(api("/api/reminders"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setDraft(null);
    mutate();
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deadlines &amp; Reminders</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Buyer next-actions and manual reminders, by due date.
          </p>
        </div>
        <button
          onClick={() =>
            setDraft({ title: "", type: "Custom", dueDate: null, notes: "" })
          }
          className="rounded-md px-3 py-2 text-sm font-medium text-black"
          style={{ background: "var(--ct-accent)" }}
        >
          + Add reminder
        </button>
      </header>

      {items.length === 0 && (
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          Nothing due. Add a reminder, or set next-action dates on buyers in
          Outreach.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {BUCKETS.map((bucket) =>
          grouped[bucket].length === 0 ? null : (
            <section key={bucket}>
              <h2
                className="mb-2 text-xs font-semibold uppercase tracking-wide"
                style={{ color: BUCKET_COLOR[bucket] }}
              >
                {bucket} ({grouped[bucket].length})
              </h2>
              <div
                className="overflow-hidden rounded-lg border"
                style={{ background: "var(--ct-surface)" }}
              >
                {grouped[bucket].map((it) => (
                  <div
                    key={it.key}
                    className="flex items-center gap-3 border-b px-4 py-3 last:border-0"
                  >
                    <div className="w-20 shrink-0 text-xs tabular-nums" style={{ color: "var(--ct-muted)" }}>
                      {it.dueDate ?? "—"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{it.title}</div>
                      <div className="text-xs" style={{ color: "var(--ct-muted)" }}>
                        {it.source} · {it.sub}
                      </div>
                    </div>
                    {it.href && (
                      <a
                        href={it.href}
                        className="text-xs"
                        style={{ color: "var(--ct-teal)" }}
                      >
                        Open
                      </a>
                    )}
                    {it.reminderId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => complete(it.reminderId!)}
                          className="text-xs"
                          style={{ color: "var(--ct-green)" }}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => remove(it.reminderId!)}
                          className="text-xs"
                          style={{ color: "var(--ct-red)" }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ),
        )}
      </div>

      {doneReminders.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ct-muted)" }}>
            Completed ({doneReminders.length})
          </h2>
          <div className="flex flex-col gap-1">
            {doneReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 text-sm"
                style={{ color: "var(--ct-muted)" }}
              >
                <span className="line-through">{r.title}</span>
                <button onClick={() => reopen(r.id)} className="text-xs" style={{ color: "var(--ct-teal)" }}>
                  Reopen
                </button>
                <button onClick={() => remove(r.id)} className="text-xs" style={{ color: "var(--ct-red)" }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add drawer */}
      {draft && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-md overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-4 text-lg font-bold">New reminder</h2>
            <div className="flex flex-col gap-4">
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Title</span>
                <input className="input" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Type</span>
                <select className="input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ReminderType })}>
                  {REMINDER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Due date</span>
                <input type="date" className="input" value={draft.dueDate ?? ""} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--ct-muted)" }}>Notes</span>
                <textarea className="input min-h-24" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={saveDraft} className="rounded-md px-4 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>
                Save
              </button>
              <button onClick={() => setDraft(null)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-muted)" }}>
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
