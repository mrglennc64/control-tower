import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

function normTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

// Bulk import. Body: { contacts: Partial<Contact>[] } (already mapped client-side).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const incoming: Partial<Contact>[] = Array.isArray(body?.contacts)
    ? body.contacts
    : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "no rows" }, { status: 400 });
  }
  const contacts = await readJson<Contact[]>("contacts.json");
  const now = new Date().toISOString();
  let added = 0;
  for (const row of incoming) {
    const name = (row.name ?? "").toString().trim();
    if (!name) continue; // skip rows with no name
    contacts.push({
      id: randomUUID(),
      name,
      email: (row.email ?? "").toString().trim(),
      company: (row.company ?? "").toString().trim(),
      phone: (row.phone ?? "").toString().trim(),
      tags: normTags(row.tags),
      notes: (row.notes ?? "").toString(),
      createdAt: now,
      updatedAt: now,
    });
    added++;
  }
  await writeJson("contacts.json", contacts);
  return NextResponse.json({ added, total: contacts.length });
}
