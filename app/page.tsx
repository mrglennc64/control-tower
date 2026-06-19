"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  STAGES,
  type Buyer,
  type Product,
  type Reminder,
  type Task,
  type Entity,
  type Milestone,
} from "@/lib/types";
import { fetcher } from "@/lib/api";

const STATUS_COLOR: Record<Product["status"], string> = {
  "for sale": "var(--ct-accent)",
  production: "var(--ct-green)",
  active: "var(--ct-teal)",
  "pre-mvp": "var(--ct-muted)",
  archived: "var(--ct-muted)",
};

export default function Overview() {
  const { data: buyers } = useSWR<Buyer[]>("/api/buyers", fetcher);
  const { data: products } = useSWR<Product[]>("/api/products", fetcher);
  const { data: reminders } = useSWR<Reminder[]>("/api/reminders", fetcher);
  const { data: tasks } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: entities } = useSWR<Entity[]>("/api/entities", fetcher);
  const { data: milestones } = useSWR<Milestone[]>("/api/milestones", fetcher);

  const list = buyers ?? [];
  const activeProducts = (products ?? []).filter(
    (p) => p.status !== "archived",
  ).length;

  const advancedStages = new Set(["NDA", "Tech review", "Offer"]);
  const atNdaPlus = list.filter((b) => advancedStages.has(b.stage)).length;
  const dealTemp = list.filter(
    (b) => STAGES.indexOf(b.stage) > STAGES.indexOf("Replied"),
  ).length;

  // Soonest upcoming item across buyer next-actions and open reminders.
  const dueItems = [
    ...list
      .filter((b) => b.nextActionDate)
      .map((b) => ({ date: b.nextActionDate!, label: b.name })),
    ...(reminders ?? [])
      .filter((r) => !r.done && r.dueDate)
      .map((r) => ({ date: r.dueDate!, label: r.title })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));
  const nextDue = dueItems[0];

  const taskList = tasks ?? [];
  const inProgress = taskList.filter((t) => t.column === "In progress").length;
  const blocked = taskList.filter((t) => t.column === "Blocked").length;
  const entityCount = (entities ?? []).length;

  const today = new Date().toISOString().slice(0, 10);
  const nextMilestone = (milestones ?? [])
    .filter((m) => !m.done && m.date && m.date >= today)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))[0];

  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
          The state of your operation, at a glance.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          href="#products"
          label="Active products"
          value={String(activeProducts)}
          hint="in your portfolio"
        />
        <Tile
          href="/outreach"
          label="Outreach pipeline"
          value={`${list.length}`}
          hint={`${atNdaPlus} at NDA or beyond`}
        />
        <Tile
          href="/deadlines"
          label="Next action due"
          value={nextDue?.date ?? "—"}
          hint={nextDue ? nextDue.label : "nothing scheduled"}
        />
        <Tile
          href="/outreach"
          label="Deal temperature"
          value={String(dealTemp)}
          hint="buyers past “Replied”"
        />
        <Tile
          href="/workboard"
          label="In-progress builds"
          value={String(inProgress)}
          hint={blocked > 0 ? `${blocked} blocked` : "nothing blocked"}
        />
        <Tile
          href="/timeline"
          label="Next milestone"
          value={nextMilestone?.date ?? "—"}
          hint={nextMilestone ? nextMilestone.title : "none scheduled"}
        />
        <Tile
          href="/entities"
          label="Entities"
          value={String(entityCount)}
          hint="companies tracked"
        />
        <Tile
          href="/finance"
          label="Financials"
          value="View"
          hint="cash, burn, runway"
        />
      </div>

      <section id="products">
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--ct-muted)" }}>
          Product & IP inventory
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(products ?? []).map((p) => (
            <div
              key={p.id}
              className="rounded-lg border p-4"
              style={{ background: "var(--ct-surface)" }}
            >
              {p.category && (
                <div
                  className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--ct-muted)" }}
                >
                  {p.category}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {p.name} ↗
                    </a>
                  ) : (
                    p.name
                  )}
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-black"
                  style={{ background: STATUS_COLOR[p.status] }}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--ct-muted)" }}>
                {p.purpose}
              </p>
              {(p.vertical || p.repo) && (
                <p className="mt-2 text-xs" style={{ color: "var(--ct-muted)" }}>
                  {p.vertical ? `Vertical · ${p.vertical}` : p.repo}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border p-4 transition-colors hover:border-[var(--ct-accent)]"
      style={{ background: "var(--ct-surface)" }}
    >
      <div className="text-xs" style={{ color: "var(--ct-muted)" }}>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs" style={{ color: "var(--ct-muted)" }}>
        {hint}
      </div>
    </Link>
  );
}
