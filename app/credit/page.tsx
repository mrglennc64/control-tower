"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  CREDIT_TIERS,
  CREDIT_STATUS,
  type CreditTask,
  type CreditAccount,
  type CreditProfile,
  type CreditTier,
  type CreditStatus,
} from "@/lib/types";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

function emptyAccount(): CreditAccount {
  return {
    id: "",
    name: "",
    tier: "Vendor (Net-30)",
    limit: 0,
    balance: 0,
    status: "researching",
    reportsTo: "",
    opened: null,
    notes: "",
  };
}

export default function CreditPage() {
  const [tasks, setTasks] = useState<CreditTask[]>([]);
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [profile, setProfile] = useState<CreditProfile | null>(null);
  const [editing, setEditing] = useState<CreditAccount | null>(null);
  const [msg, setMsg] = useState("");

  async function loadAll() {
    const [t, a, p] = await Promise.all([
      fetch(api("/api/credit/tasks")).then((r) => r.json()),
      fetch(api("/api/credit/accounts")).then((r) => r.json()),
      fetch(api("/api/credit/profile")).then((r) => r.json()),
    ]);
    setTasks(t);
    setAccounts(a);
    setProfile(p);
  }
  useEffect(() => {
    loadAll();
  }, []);

  async function toggleTask(id: string) {
    const next = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(next);
    await fetch(api("/api/credit/tasks"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: next }),
    });
  }

  async function saveProfile() {
    if (!profile) return;
    await fetch(api("/api/credit/profile"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setMsg("Profile saved.");
  }

  async function saveAccounts(next: CreditAccount[]) {
    setAccounts(next);
    await fetch(api("/api/credit/accounts"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accounts: next }),
    });
  }

  function saveEditing() {
    if (!editing) return;
    const e = { ...editing };
    let next: CreditAccount[];
    if (e.id) {
      next = accounts.map((a) => (a.id === e.id ? e : a));
    } else {
      e.id = `acct-${Date.now()}`;
      next = [...accounts, e];
    }
    saveAccounts(next);
    setEditing(null);
  }

  function removeAccount(id: string) {
    if (!confirm("Delete this account?")) return;
    saveAccounts(accounts.filter((a) => a.id !== id));
    setEditing(null);
  }

  const totals = useMemo(() => {
    const open = accounts.filter((a) => a.status === "open");
    const limit = open.reduce((s, a) => s + (a.limit || 0), 0);
    const bal = open.reduce((s, a) => s + (a.balance || 0), 0);
    const reporting = accounts.filter((a) => a.reportsTo.trim()).length;
    return { limit, bal, util: limit ? Math.round((bal / limit) * 100) : 0, reporting };
  }, [accounts]);

  const phases = useMemo(() => {
    const order: string[] = [];
    const byPhase: Record<string, CreditTask[]> = {};
    tasks.forEach((t) => {
      if (!byPhase[t.phase]) {
        byPhase[t.phase] = [];
        order.push(t.phase);
      }
      byPhase[t.phase].push(t);
    });
    return order.map((p) => ({ phase: p, items: byPhase[p] }));
  }, [tasks]);

  const doneCount = tasks.filter((t) => t.done).length;

  if (!profile) return <p style={{ color: "var(--ct-muted)" }}>Loading…</p>;

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Business Credit</h1>
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          Your journey to unsecured business credit — foundation → vendor → cards → lines → corporate.
        </p>
      </header>

      {/* Tiles */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="D-U-N-S" value={profile.dunsNumber ? "✓ set" : "—"} hint={profile.dunsNumber || "register at D&B"} />
        <Tile label="Paydex" value={profile.paydex ? String(profile.paydex) : "—"} hint="business credit score" />
        <Tile label="Available credit" value={money(totals.limit)} hint={`${totals.util}% utilized`} />
        <Tile label="Roadmap" value={`${doneCount}/${tasks.length}`} hint="steps done" />
      </div>

      {/* Profile */}
      <section className="mb-8 rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--ct-muted)" }}>Profile</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="EIN"><input className="input" value={profile.ein} onChange={(e) => setProfile({ ...profile, ein: e.target.value })} /></Field>
          <Field label="D-U-N-S number"><input className="input" value={profile.dunsNumber} onChange={(e) => setProfile({ ...profile, dunsNumber: e.target.value })} /></Field>
          <Field label="Paydex (0–100)"><input className="input" type="number" value={profile.paydex} onChange={(e) => setProfile({ ...profile, paydex: Number(e.target.value) })} /></Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={profile.businessBank} onChange={(e) => setProfile({ ...profile, businessBank: e.target.checked })} />
            <span>Business bank account</span>
          </label>
        </div>
        <Field label="Notes"><textarea className="input min-h-16" value={profile.notes} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} /></Field>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveProfile} className="rounded-md px-3 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>Save profile</button>
          {msg && <span className="text-xs" style={{ color: "var(--ct-green)" }}>{msg}</span>}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--ct-muted)" }}>Roadmap</h2>
        <div className="flex flex-col gap-4">
          {phases.map(({ phase, items }) => (
            <div key={phase} className="rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
              <div className="mb-2 text-sm font-semibold">{phase}</div>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <label key={t.id} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="mt-1" />
                    <span style={{ color: t.done ? "var(--ct-muted)" : "var(--ct-text)", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Accounts */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--ct-muted)" }}>Credit accounts</h2>
          <button onClick={() => setEditing(emptyAccount())} className="rounded-md px-3 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>+ Add account</button>
        </div>
        <div className="overflow-x-auto rounded-lg border" style={{ background: "var(--ct-surface)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ color: "var(--ct-muted)" }}>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Limit</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Reports to</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>No accounts yet. Add your Net-30s and cards as you open them.</td></tr>
              )}
              {accounts.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <button className="font-medium hover:underline" onClick={() => setEditing({ ...a })}>{a.name}</button>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>{a.tier}</td>
                  <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>{a.status}</td>
                  <td className="px-4 py-3 tabular-nums">{money(a.limit)}</td>
                  <td className="px-4 py-3 tabular-nums">{money(a.balance)}</td>
                  <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>{a.reportsTo || "—"}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => removeAccount(a.id)} className="text-xs" style={{ color: "var(--ct-red)" }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Account drawer */}
      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-md overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-4 text-lg font-bold">{editing.id ? "Edit account" : "New account"}</h2>
            <div className="flex flex-col gap-4">
              <Field label="Account name (e.g. Uline, Chase Ink)"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Tier">
                <select className="input" value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value as CreditTier })}>
                  {CREDIT_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as CreditStatus })}>
                  {CREDIT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Limit (USD)"><input className="input" type="number" value={editing.limit} onChange={(e) => setEditing({ ...editing, limit: Number(e.target.value) })} /></Field>
              <Field label="Balance (USD)"><input className="input" type="number" value={editing.balance} onChange={(e) => setEditing({ ...editing, balance: Number(e.target.value) })} /></Field>
              <Field label="Reports to (D&B, Experian, Equifax)"><input className="input" value={editing.reportsTo} onChange={(e) => setEditing({ ...editing, reportsTo: e.target.value })} /></Field>
              <Field label="Opened"><input className="input" type="date" value={editing.opened ?? ""} onChange={(e) => setEditing({ ...editing, opened: e.target.value || null })} /></Field>
              <Field label="Notes"><textarea className="input min-h-20" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={saveEditing} className="rounded-md px-4 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>Save</button>
              {editing.id && <button onClick={() => removeAccount(editing.id)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-red)" }}>Delete</button>}
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
