"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  FINANCE_KINDS,
  type FinanceEntry,
  type FinanceKind,
  type FinanceState,
} from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Greens for money in, accent/red for money out.
const KIND_COLOR: Record<FinanceKind, string> = {
  Revenue: "var(--ct-green)",
  "Asset sale": "var(--ct-green)",
  "One-time expense": "var(--ct-accent)",
  "Recurring expense": "var(--ct-red)",
};

function fmtCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "SEK",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Invalid currency code — fall back to plain number + code.
    return `${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(amount)} ${currency || "SEK"}`;
  }
}

function emptyEntry(): {
  label: string;
  kind: FinanceKind;
  amount: number;
  date: string;
} {
  return { label: "", kind: "Revenue", amount: 0, date: "" };
}

export default function FinancePage() {
  const { data, mutate } = useSWR<FinanceState>("/api/finance", fetcher);
  const [state, setState] = useState<FinanceState | null>(null);
  const [draft, setDraft] = useState(emptyEntry());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed local editable state once, when SWR first delivers data.
  useEffect(() => {
    if (data && state === null) setState(data);
  }, [data, state]);

  const byKind = useMemo(() => {
    const map = Object.fromEntries(FINANCE_KINDS.map((k) => [k, 0])) as Record<
      FinanceKind,
      number
    >;
    (state?.entries ?? []).forEach((e) => {
      map[e.kind] = (map[e.kind] ?? 0) + (Number(e.amount) || 0);
    });
    return map;
  }, [state?.entries]);

  const maxKind = Math.max(1, ...Object.values(byKind));

  if (!state) {
    return (
      <div className="max-w-4xl">
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          Loading…
        </p>
      </div>
    );
  }

  const currency = state.currency || "SEK";
  const runway =
    state.monthlyBurn > 0 ? state.cashOnHand / state.monthlyBurn : null;
  const runwayLabel =
    runway === null ? "∞" : `${runway.toFixed(1)} months`;
  const runwayColor =
    runway !== null && runway < 3 ? "var(--ct-red)" : "var(--ct-green)";

  function update(patch: Partial<FinanceState>) {
    setState((s) => (s ? { ...s, ...patch } : s));
    setSaved(false);
  }

  function addEntry() {
    if (!draft.label.trim() && !draft.amount) return;
    const entry: FinanceEntry = {
      id: crypto.randomUUID(),
      label: draft.label,
      amount: Number(draft.amount) || 0,
      kind: draft.kind,
      date: draft.date || null,
      notes: "",
    };
    update({ entries: [...state!.entries, entry] });
    setDraft(emptyEntry());
  }

  function removeEntry(id: string) {
    update({ entries: state!.entries.filter((e) => e.id !== id) });
  }

  async function save() {
    if (!state) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/finance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      await mutate();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Financial Snapshot</h1>
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          A glance, not a ledger. Cash, burn, runway.
        </p>
      </header>

      {/* KPI tiles */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile
          label="Cash on hand"
          value={fmtCurrency(state.cashOnHand, currency)}
        />
        <Tile
          label="Monthly burn"
          value={fmtCurrency(state.monthlyBurn, currency)}
        />
        <Tile label="Runway" value={runwayLabel} valueColor={runwayColor} />
      </div>

      {/* Edit basics */}
      <section
        className="mb-8 rounded-lg border p-4"
        style={{ background: "var(--ct-surface)" }}
      >
        <h2
          className="mb-3 text-sm font-semibold"
          style={{ color: "var(--ct-muted)" }}
        >
          Edit
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span
              className="mb-1 block text-xs"
              style={{ color: "var(--ct-muted)" }}
            >
              Currency
            </span>
            <input
              className="input"
              value={state.currency}
              onChange={(e) => update({ currency: e.target.value })}
            />
          </label>
          <label className="block">
            <span
              className="mb-1 block text-xs"
              style={{ color: "var(--ct-muted)" }}
            >
              Cash on hand
            </span>
            <input
              type="number"
              className="input"
              value={state.cashOnHand}
              onChange={(e) => update({ cashOnHand: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span
              className="mb-1 block text-xs"
              style={{ color: "var(--ct-muted)" }}
            >
              Monthly burn
            </span>
            <input
              type="number"
              className="input"
              value={state.monthlyBurn}
              onChange={(e) => update({ monthlyBurn: Number(e.target.value) })}
            />
          </label>
        </div>
      </section>

      {/* By category bar chart */}
      <section
        className="mb-8 rounded-lg border p-4"
        style={{ background: "var(--ct-surface)" }}
      >
        <h2
          className="mb-3 text-sm font-semibold"
          style={{ color: "var(--ct-muted)" }}
        >
          By category
        </h2>
        <div className="flex flex-col gap-2">
          {FINANCE_KINDS.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <div
                className="w-36 shrink-0 text-xs"
                style={{ color: "var(--ct-muted)" }}
              >
                {k}
              </div>
              <div
                className="h-5 flex-1 overflow-hidden rounded"
                style={{ background: "var(--ct-surface-2)" }}
              >
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(byKind[k] / maxKind) * 100}%`,
                    background: KIND_COLOR[k],
                    minWidth: byKind[k] > 0 ? "1.5rem" : 0,
                  }}
                />
              </div>
              <div className="w-28 text-right text-sm tabular-nums">
                {fmtCurrency(byKind[k], currency)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Entries table */}
      <section
        className="mb-8 overflow-hidden rounded-lg border"
        style={{ background: "var(--ct-surface)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-left"
              style={{ color: "var(--ct-muted)" }}
            >
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {state.entries.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center"
                  style={{ color: "var(--ct-muted)" }}
                >
                  No entries yet. Add one below.
                </td>
              </tr>
            )}
            {state.entries.map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{e.label || "—"}</td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>
                  {e.kind}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {fmtCurrency(Number(e.amount) || 0, currency)}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>
                  {e.date || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeEntry(e.id)}
                    className="text-xs"
                    style={{ color: "var(--ct-red)" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t" style={{ background: "var(--ct-surface-2)" }}>
              <td className="px-4 py-3">
                <input
                  className="input"
                  placeholder="Label"
                  value={draft.label}
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value })
                  }
                />
              </td>
              <td className="px-4 py-3">
                <select
                  className="input"
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft({ ...draft, kind: e.target.value as FinanceKind })
                  }
                >
                  {FINANCE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  className="input"
                  placeholder="Amount"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: Number(e.target.value) })
                  }
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="date"
                  className="input"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={addEntry}
                  className="rounded-md px-3 py-2 text-sm font-medium text-black"
                  style={{ background: "var(--ct-accent)" }}
                >
                  + Add entry
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
          style={{ background: "var(--ct-accent)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: "var(--ct-green)" }}>
            Saved
          </span>
        )}
      </div>

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

function Tile({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ background: "var(--ct-surface)" }}
    >
      <div className="text-xs" style={{ color: "var(--ct-muted)" }}>
        {label}
      </div>
      <div
        className="mt-2 text-2xl font-bold tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
