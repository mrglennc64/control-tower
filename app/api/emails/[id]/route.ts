import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { EmailTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
  if (typeof v === "string")
    return v.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const emails = await readJson<EmailTemplate[]>("emails.json");
  const idx = emails.findIndex((e) => e.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (typeof patch.title === "string") emails[idx].title = patch.title;
  if (typeof patch.category === "string") emails[idx].category = patch.category;
  if (typeof patch.body === "string") emails[idx].body = patch.body;
  if ("tags" in patch) emails[idx].tags = normTags(patch.tags);
  emails[idx].updatedAt = new Date().toISOString();
  await writeJson("emails.json", emails);
  return NextResponse.json(emails[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const emails = await readJson<EmailTemplate[]>("emails.json");
  const next = emails.filter((e) => e.id !== id);
  if (next.length === emails.length)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  await writeJson("emails.json", next);
  return NextResponse.json({ ok: true });
}
