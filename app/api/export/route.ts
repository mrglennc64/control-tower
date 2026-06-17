import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import type { Buyer, Product, Meta, Reminder } from "@/lib/types";

export const dynamic = "force-dynamic";

function toCsv(buyers: Buyer[]): string {
  const cols: (keyof Buyer)[] = [
    "name",
    "category",
    "fitScore",
    "stage",
    "lastActivity",
    "nextAction",
    "nextActionDate",
    "notes",
    "createdAt",
    "updatedAt",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const rows = buyers.map((b) => cols.map((c) => esc(b[c])).join(","));
  return [header, ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const buyers = await readJson<Buyer[]>("buyers.json");

  if (format === "csv") {
    return new NextResponse(toCsv(buyers), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="buyers.csv"',
      },
    });
  }

  const products = await readJson<Product[]>("products.json");
  const reminders = await readJson<Reminder[]>("reminders.json");
  const meta = await readJson<Meta>("meta.json");
  const bundle = {
    exportedAt: new Date().toISOString(),
    meta,
    products,
    buyers,
    reminders,
  };
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="control-tower-export.json"',
    },
  });
}
