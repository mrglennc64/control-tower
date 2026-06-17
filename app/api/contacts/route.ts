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

export async function GET() {
  const contacts = await readJson<Contact[]>("contacts.json");
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contacts = await readJson<Contact[]>("contacts.json");
  const now = new Date().toISOString();
  const contact: Contact = {
    id: randomUUID(),
    name: body.name ?? "Unnamed",
    email: body.email ?? "",
    company: body.company ?? "",
    phone: body.phone ?? "",
    tags: normTags(body.tags),
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  contacts.push(contact);
  await writeJson("contacts.json", contacts);
  return NextResponse.json(contact, { status: 201 });
}
