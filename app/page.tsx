"use client";

import Link from "next/link";
import useSWR from "swr";
import { STAGES, type Buyer, type Product } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

  const list = buyers ?? [];
  const activeProducts = (products ?? []).filter(
    (p) => p.status !== "archived",
  ).length;

  const advancedStages = new Set(["NDA", "Tech review", "Offer"]);
  const atNdaPlus = list.filter((b) => advancedStages.has(b.stage)).length;
  const dealTemp = list.filter(
    (b) => STAGES.indexOf(b.stage) > STAGES.indexOf("Replied"),
  ).length;

  const nextDue = list
    .filter((b) => b.nextActionDate)
    .sort((a, b) => (a.nextActionDate! < b.nextActionDate! ? -1 : 1))[0];

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
          href="/outreach"
          label="Next action due"
          value={nextDue?.nextActionDate ?? "—"}
          hint={nextDue ? nextDue.name : "nothing scheduled"}
        />
        <Tile
          href="/outreach"
          label="Deal temperature"
          value={String(dealTemp)}
          hint="buyers past “Replied”"
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
              <div className="flex items-center justify-between">
                <div className="font-medium">{p.name}</div>
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
              {p.repo && (
                <p className="mt-2 text-xs" style={{ color: "var(--ct-muted)" }}>
                  {p.repo}
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
