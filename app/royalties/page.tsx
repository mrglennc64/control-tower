"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher, api } from "@/lib/api";
import { CLAIM_STAGES, type RoyaltyClaim, type ClaimStage } from "@/lib/types";

const STAGE_COLOR: Record<ClaimStage, string> = {
  Lead: "var(--ct-muted)",
  Verified: "var(--ct-teal)",
  Bundled: "var(--ct-teal)",
  Filed: "var(--ct-accent)",
  Recovered: "var(--ct-accent)",
  Paid: "var(--ct-teal)",
  Dead: "var(--ct-red)",
};

function emptyClaim(): Partial<RoyaltyClaim> {
  return {
    artist: "",
    track: "",
    isrc: "",
    estimatedRecovery: 0,
    recoveredAmount: 0,
    feeRate: 0.05,
    stage: "Lead",
    attorney: "Atlanta MOA",
    bundle: "",
    filedDate: null,
    notes: "",
  };
}

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function RoyaltiesPage() {
  const { data: claims, mutate, isLoading } = useSWR<RoyaltyClaim[]>(
    "/api/claims",
    fetcher,
  );
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<ClaimStage | "All">("All");
  const [editing, setEditing] = useState<Partial<RoyaltyClaim> | null>(null);

  const list = claims ?? [];

  const filtered = useMemo(() => {
    let l = list;
    if (stageFilter !== "All") l = l.filter((c) => c.stage === stageFilter);
    if (q.trim()) {
      const t = q.toLowerCase();
      l = l.filter((c) =>
        [c.artist, c.track, c.isrc, c.attorney, c.bundle, c.notes]
          .join(" ")
          .toLowerCase()
          .includes(t),
      );
    }
    return l;
  }, [list, q, stageFilter]);

  const stats = useMemo(() => {
    const live = list.filter((c) => c.stage !== "Dead");
    const pipelineEst = live
      .filter((c) => c.stage !== "Paid")
      .reduce((s, c) => s + (c.estimatedRecovery || 0), 0);
    const filedCount = list.filter((c) =>
      ["Filed", "Recovered", "Paid"].includes(c.stage),
    ).length;
    const recovered = list.reduce((s, c) => s + (c.recoveredAmount || 0), 0);
    const fees = list.reduce(
      (s, c) => s + (c.recoveredAmount || 0) * (c.feeRate || 0),
      0,
    );
    const leadsToVerify = list.filter((c) => c.stage === "Lead").length;
    return { pipelineEst, filedCount, recovered, fees, leadsToVerify };
  }, [list]);

  async function save() {
    if (!editing) return;
    const payload = {
      ...editing,
      estimatedRecovery: Number(editing.estimatedRecovery) || 0,
      recoveredAmount: Number(editing.recoveredAmount) || 0,
      feeRate: Number(editing.feeRate) || 0,
    };
    if (editing.id) {
      await fetch(api(`/api/claims/${editing.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(api("/api/claims"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setEditing(null);
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this claim?")) return;
    await fetch(api(`/api/claims/${id}`), { method: "DELETE" });
    setEditing(null);
    mutate();
  }

  return (
    <div className="max-w-7xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Royalties</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Lead → Verified → Bundled → Filed → Recovered → Paid · your{" "}
            {Math.round((list[0]?.feeRate ?? 0.05) * 100)}% fee auto-totaled
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyClaim())}
          className="rounded-md px-3 py-2 text-sm font-medium text-black"
          style={{ background: "var(--ct-accent)" }}
        >
          + Add claim
        </button>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Tile label="Pipeline (est.)" value={usd(stats.pipelineEst)} />
        <Tile label="Bundles filed" value={String(stats.filedCount)} />
        <Tile label="Recovered" value={usd(stats.recovered)} accent="var(--ct-teal)" />
        <Tile label="Your fees" value={usd(stats.fees)} accent="var(--ct-accent)" />
        <Tile label="Leads to verify" value={String(stats.leadsToVerify)} />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search artist, track, ISRC, bundle…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input max-w-[10rem]"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as ClaimStage | "All")}
        >
          <option value="All">All stages</option>
          {CLAIM_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs" style={{ color: "var(--ct-muted)" }}>
          {filtered.length} of {list.length}
        </span>
      </div>

      <section
        className="overflow-x-auto rounded-lg border"
        style={{ background: "var(--ct-surface)" }}
      >
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr className="border-b text-left" style={{ color: "var(--ct-muted)" }}>
              <th className="px-4 py-3 font-medium">Artist / Track</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Bundle</th>
              <th className="px-4 py-3 font-medium">Filed</th>
              <th className="px-4 py-3 text-right font-medium">Est.</th>
              <th className="px-4 py-3 text-right font-medium">Recovered</th>
              <th className="px-4 py-3 text-right font-medium">Your fee</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center" style={{ color: "var(--ct-muted)" }}>
                  No claims. Add one, or import the verified leads when they&apos;re ready.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 align-top">
                <td className="px-4 py-3">
                  <button
                    className="font-medium hover:underline"
                    onClick={() => setEditing({ ...c })}
                  >
                    {c.artist || "—"}
                  </button>
                  {c.track && (
                    <div className="mt-0.5 truncate text-xs" style={{ color: "var(--ct-muted)" }} title={c.track}>
                      {c.track}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ background: "var(--ct-surface-2)", color: STAGE_COLOR[c.stage] }}
                  >
                    {c.stage}
                  </span>
                </td>
                <td className="truncate px-4 py-3" style={{ color: "var(--ct-muted)" }} title={c.bundle}>
                  {c.bundle || "—"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--ct-muted)" }}>
                  {c.filedDate || "—"}
                </td>
                <td className="px-4 py-3 text-right" style={{ color: "var(--ct-muted)" }}>
                  {c.estimatedRecovery ? usd(c.estimatedRecovery) : "—"}
                </td>
                <td className="px-4 py-3 text-right" style={{ color: "var(--ct-teal)" }}>
                  {c.recoveredAmount ? usd(c.recoveredAmount) : "—"}
                </td>
                <td className="px-4 py-3 text-right" style={{ color: "var(--ct-accent)" }}>
                  {c.recoveredAmount ? usd(c.recoveredAmount * c.feeRate) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={() => remove(c.id)}
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

      {editing && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/50">
          <div className="h-full w-full max-w-md overflow-y-auto border-l p-6" style={{ background: "var(--ct-surface)" }}>
            <h2 className="mb-4 text-lg font-bold">{editing.id ? "Edit claim" : "New claim"}</h2>
            <div className="flex flex-col gap-4">
              <Field label="Artist">
                <input className="input" value={editing.artist ?? ""} onChange={(e) => setEditing({ ...editing, artist: e.target.value })} />
              </Field>
              <Field label="Track">
                <input className="input" value={editing.track ?? ""} onChange={(e) => setEditing({ ...editing, track: e.target.value })} />
              </Field>
              <Field label="ISRC">
                <input className="input" value={editing.isrc ?? ""} onChange={(e) => setEditing({ ...editing, isrc: e.target.value })} />
              </Field>
              <Field label="Stage">
                <select className="input" value={editing.stage ?? "Lead"} onChange={(e) => setEditing({ ...editing, stage: e.target.value as ClaimStage })}>
                  {CLAIM_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Estimated recovery ($)">
                  <input className="input" type="number" value={editing.estimatedRecovery ?? 0} onChange={(e) => setEditing({ ...editing, estimatedRecovery: Number(e.target.value) })} />
                </Field>
                <Field label="Recovered ($)">
                  <input className="input" type="number" value={editing.recoveredAmount ?? 0} onChange={(e) => setEditing({ ...editing, recoveredAmount: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="Fee rate (e.g. 0.05 = 5%)">
                <input className="input" type="number" step="0.01" value={editing.feeRate ?? 0.05} onChange={(e) => setEditing({ ...editing, feeRate: Number(e.target.value) })} />
              </Field>
              {(editing.recoveredAmount ?? 0) > 0 && (
                <div className="rounded-md border p-3 text-sm" style={{ background: "var(--ct-surface-2)" }}>
                  <span style={{ color: "var(--ct-muted)" }}>Your fee: </span>
                  <span style={{ color: "var(--ct-accent)" }}>
                    {usd((editing.recoveredAmount ?? 0) * (editing.feeRate ?? 0))}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bundle">
                  <input className="input" value={editing.bundle ?? ""} onChange={(e) => setEditing({ ...editing, bundle: e.target.value })} />
                </Field>
                <Field label="Filed date">
                  <input className="input" type="date" value={editing.filedDate ?? ""} onChange={(e) => setEditing({ ...editing, filedDate: e.target.value || null })} />
                </Field>
              </div>
              <Field label="Attorney">
                <input className="input" value={editing.attorney ?? ""} onChange={(e) => setEditing({ ...editing, attorney: e.target.value })} />
              </Field>
              <Field label="Notes">
                <textarea className="input min-h-24" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </Field>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={save} className="rounded-md px-4 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>Save</button>
              {editing.id && (
                <button onClick={() => remove(editing.id!)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-red)" }}>Delete</button>
              )}
              <button onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-sm" style={{ color: "var(--ct-muted)" }}>Cancel</button>
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

function Tile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
      <div className="text-xs" style={{ color: "var(--ct-muted)" }}>{label}</div>
      <div className="mt-1 text-xl font-bold" style={{ color: accent ?? "var(--ct-text)" }}>{value}</div>
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
