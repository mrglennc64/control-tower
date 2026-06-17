import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return [name.trim(), ""];
  return [parts[0], parts.slice(1).join(" ")];
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") ?? "plain";
  const contacts = await readJson<Contact[]>("contacts.json");

  let header: string[];
  let rows: string[][];
  let filename: string;

  if (format === "smartlead") {
    // Smartlead import format: email is the key column.
    header = [
      "email",
      "first_name",
      "last_name",
      "company_name",
      "phone_number",
      "tags",
      "notes",
    ];
    rows = contacts.map((c) => {
      const [first, last] = splitName(c.name);
      return [
        c.email,
        first,
        last,
        c.company,
        c.phone,
        c.tags.join("; "),
        c.notes,
      ];
    });
    filename = "contacts-smartlead.csv";
  } else {
    header = ["name", "email", "company", "phone", "tags", "notes"];
    rows = contacts.map((c) => [
      c.name,
      c.email,
      c.company,
      c.phone,
      c.tags.join("; "),
      c.notes,
    ]);
    filename = "contacts.csv";
  }

  const csv = [header.join(","), ...rows.map((r) => r.map(esc).join(","))].join(
    "\n",
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
