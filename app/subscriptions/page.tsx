"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher, api } from "@/lib/api";
import {
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  type Subscription,
  type BillingCycle,
  type SubscriptionStatus,
  type Payment,
} from "@/lib/types";

const fmt = (n: number, cur: string) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur || "USD", maximumFractionDigits: 2 }).format(n || 0);
  } catch {
    return `${cur} ${(n || 0).toFixed(2)}`;
  }
};
const today = () => new Date().toISOString().slice(0, 10);
function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.round((new Date(d + "T00:00:00").getTime() - new Date(today() + "T00:00:00").getTime()) / 86400000);
}
function monthly(s: Subscription): number {
  if (s.status !== "active") return 0;
  const a = s.amount || 0;
  if (s.cycle === "monthly") return a;
  if (s.cycle === "quarterly") return a / 3;
  if (s.cycle === "yearly") return a / 12;
  return 0; // one-time
}
function addCycle(date: string, cycle: BillingCycle): string {
  const d = new Date(date + "T00:00:00");
  if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
  else if (cycle === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function emptySub(): Subscription {
  return {
    id: "", name: "", provider: "Hostinger", account: "", plan: "", amount: 0,
    currency: "USD", cycle: "yearly", nextRenewal: null, autoRenew: true,
    status: "active", paymentMethod: "", payments: [], notes: "",
    createdAt: "", updatedAt: "",
  };
}

export default function SubscriptionsPage() {
  const { data: subs, mutate, isLoading } = useSWR<Subscription[]>("/api/subscriptions", fetcher);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [payDate, setPayDate] = useState(today());
  const [payAmt, setPayAmt] = useState(0);

  const list = subs ?? [];
  const totals = useMemo(() => {
    const m = list.reduce((s, x) => s + monthly(x), 0);
    const active = list.filter((x) => x.status === "active").length;
    const upcoming = list
      .filter((x) => x.status === "active" && x.nextRenewal)
      .sort((a, b) => (a.nextRenewal! < b.nextRenewal! ? -1 : 1))[0];
    return { monthly: m, annual: m * 12, active, upcoming };
  }, [list]);

  const filtered = useMemo(() => {
    const sorted = [...list].sort((a, b) => {
      if (!a.nextRenewal) return 1;
      if (!b.nextRenewal) return -1;
      return a.nextRenewal < b.nextRenewal ? -1 : 1;
    });
    if (!q.trim()) return sorted;
    const t = q.toLowerCase();
    return sorted.filter((s) => [s.name, s.provider, s.account, s.plan, s.notes].join(" ").toLowerCase().includes(t));
  }, [list, q]);

  async function save() {
    if (!editing) return;
    if (editing.id) {
      await fetch(api(`/api/subscriptions/${editing.id}`), {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
    } else {
      await fetch(api("/api/subscriptions"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
    }
    setEditing(null);
    mutate();
  }
  async function remove(id: string) {
    if (!confirm("Delete this subscription?")) return;
    await fetch(api(`/api/subscriptions/${id}`), { method: "DELETE" });
    setEditing(null);
    mutate();
  }
  function addPayment(advance: boolean) {
    if (!editing) return;
    const p: Payment = { id: `pay-${Date.now()}`, date: payDate, amount: Number(payAmt) || editing.amount, notes: "" };
    const next: Subscription = { ...editing, payments: [...editing.payments, p] };
    if (advance && editing.nextRenewal) next.nextRenewal = addCycle(editing.nextRenewal, editing.cycle);
    setEditing(next);
    setPayAmt(0);
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>Hosting, domains & recurring services — amounts, renewals, payment history.</p>
        </div>
        <button onClick={() => setEditing(emptySub())} className="rounded-md px-3 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>+ Add subscription</button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Monthly spend" value={fmt(totals.monthly, "USD")} hint="normalized across cycles" />
        <Tile label="Annual spend" value={fmt(totals.annual, "USD")} hint="active subscriptions" />
        <Tile label="Next renewal" value={totals.upcoming?.nextRenewal ?? "—"} hint={totals.upcoming ? totals.upcoming.name : "none scheduled"} />
        <Tile label="Active" value={String(totals.active)} hint={`${list.length} total`} />
      </div>

      <input className="input mb-4 max-w-sm" placeholder="Search name, domain, plan…" value={q} onChange={(e) => setQ(e.target.value)} />

      <section className="overflow-x-auto rounded-lg border" style={{ background: "var(--ct-surface)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ color: "var(--ct-muted)" }}>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Renews</th>
              <th className="px-4 py-3 font-medium">Auto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>Loading…</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>No subscriptions yet.</td></tr>}
            {filtered.map((s) => {
              const du = daysUntil(s.nextRenewal);
              const soon = du !== null && du <= 14;
              return (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <button className="font-medium hover:underline" onClick={() => { setEditing({ ...s }); setPayAmt(s.amount); }}>{s.name}</button>
                    <span className="block text-xs" style={{ color: "var(--ct-muted)" }}>{s.provider} · {s.plan || s.cycle}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>{s.account || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{fmt(s.amount, s.currency)}<span className="text-xs" style={{ color: "var(--ct-muted)" }}>/{s.cycle === "yearly" ? "yr" : s.cycle === "monthly" ? "mo" : s.cycle === "quarterly" ? "qtr" : "once"}</span></td>
                  <td className="px-4 py-3 tabular-nums">
                    {s.nextRenewal ?? "—"}
                    {du !== null && <span className="ml-2 text-xs" style={{ color: soon ? "var(--ct-red)" : "var(--ct-muted)" }}>{du < 0 ? `${-du}d overdue` : `in ${du}d`}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: s.autoRenew ? "var(--ct-green)" : "var(--ct-muted)" }}>{s.autoRenew ? "on" : "off"}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => remove(s.id)} className="text-xs" style={{ color: "var(--ct-red)" }}>Delete</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-md overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-4 text-lg font-bold">{editing.id ? "Edit subscription" : "New subscription"}</h2>
            <div className="flex flex-col gap-4">
              <Field label="Service name"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provider"><input className="input" value={editing.provider} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} /></Field>
                <Field label="Account / domain"><input className="input" value={editing.account} onChange={(e) => setEditing({ ...editing, account: e.target.value })} /></Field>
              </div>
              <Field label="Plan"><input className="input" value={editing.plan} onChange={(e) => setEditing({ ...editing, plan: e.target.value })} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Amount"><input className="input" type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} /></Field>
                <Field label="Currency"><input className="input" value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })} /></Field>
                <Field label="Cycle">
                  <select className="input" value={editing.cycle} onChange={(e) => setEditing({ ...editing, cycle: e.target.value as BillingCycle })}>
                    {BILLING_CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Next renewal"><input className="input" type="date" value={editing.nextRenewal ?? ""} onChange={(e) => setEditing({ ...editing, nextRenewal: e.target.value || null })} /></Field>
                <Field label="Status">
                  <select className="input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as SubscriptionStatus })}>
                    {SUBSCRIPTION_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.autoRenew} onChange={(e) => setEditing({ ...editing, autoRenew: e.target.checked })} /> Auto-renew
              </label>
              <Field label="Payment method"><input className="input" value={editing.paymentMethod} onChange={(e) => setEditing({ ...editing, paymentMethod: e.target.value })} /></Field>
              <Field label="Notes"><textarea className="input min-h-16" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>

              <div className="rounded-md border p-3" style={{ background: "var(--ct-surface-2)" }}>
                <div className="mb-2 text-xs font-medium" style={{ color: "var(--ct-muted)" }}>Payment history</div>
                {editing.payments.length === 0 && <div className="mb-2 text-xs" style={{ color: "var(--ct-muted)" }}>No payments logged.</div>}
                {editing.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span>{p.date} · {fmt(p.amount, editing.currency)}</span>
                    <button onClick={() => setEditing({ ...editing, payments: editing.payments.filter((x) => x.id !== p.id) })} style={{ color: "var(--ct-red)" }}>✕</button>
                  </div>
                ))}
                <div className="mt-2 flex items-center gap-2">
                  <input className="input" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  <input className="input w-20" type="number" value={payAmt} onChange={(e) => setPayAmt(Number(e.target.value))} />
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => addPayment(false)} className="rounded border px-2 py-1 text-xs" style={{ color: "var(--ct-teal)" }}>Log payment</button>
                  <button onClick={() => addPayment(true)} className="rounded border px-2 py-1 text-xs" style={{ color: "var(--ct-teal)" }}>Log + advance renewal</button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={save} className="rounded-md px-4 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>Save</button>
              {editing.id && <button onClick={() => remove(editing.id)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-red)" }}>Delete</button>}
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

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
      <div className="text-xs" style={{ color: "var(--ct-muted)" }}>{label}</div>
      <div className="mt-2 text-xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs" style={{ color: "var(--ct-muted)" }}>{hint}</div>
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
