import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const contacts = await readJson<Contact[]>("contacts.json");
  const idx = contacts.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const editable: (keyof Contact)[] = [
    "name",
    "email",
    "company",
    "phone",
    "tags",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      if (key === "tags") {
        contacts[idx].tags = normTags(patch.tags);
      } else {
        (contacts[idx] as unknown as Record<string, unknown>)[key] = patch[key];
      }
    }
  }
  contacts[idx].updatedAt = new Date().toISOString();
  await writeJson("contacts.json", contacts);
  return NextResponse.json(contacts[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const contacts = await readJson<Contact[]>("contacts.json");
  const next = contacts.filter((c) => c.id !== id);
  if (next.length === contacts.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("contacts.json", next);
  return NextResponse.json({ ok: true });
}
