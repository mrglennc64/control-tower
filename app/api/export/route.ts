import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import type {
  Buyer,
  Product,
  Meta,
  Reminder,
  DocumentItem,
  FinanceState,
  Task,
  Entity,
  Milestone,
  Contact,
  Subscription,
  RoyaltyClaim,
} from "@/lib/types";

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
  const documents = await readJson<DocumentItem[]>("documents.json");
  const finance = await readJson<FinanceState>("finance.json");
  const tasks = await readJson<Task[]>("tasks.json");
  const entities = await readJson<Entity[]>("entities.json");
  const milestones = await readJson<Milestone[]>("milestones.json");
  const contacts = await readJson<Contact[]>("contacts.json");
  const subscriptions = await readJson<Subscription[]>("subscriptions.json");
  const claims = await readJson<RoyaltyClaim[]>("claims.json");
  const meta = await readJson<Meta>("meta.json");
  const bundle = {
    exportedAt: new Date().toISOString(),
    meta,
    products,
    buyers,
    reminders,
    documents,
    finance,
    tasks,
    entities,
    milestones,
    contacts,
    subscriptions,
    claims,
  };
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="control-tower-export.json"',
    },
  });
}
