import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { EmailTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

function normTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
  if (typeof v === "string")
    return v.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export async function GET() {
  const emails = await readJson<EmailTemplate[]>("emails.json");
  const sorted = [...emails].sort((a, b) => {
    if (a.category !== b.category) return a.category < b.category ? -1 : 1;
    return a.title < b.title ? -1 : 1;
  });
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const emails = await readJson<EmailTemplate[]>("emails.json");
  const now = new Date().toISOString();
  const item: EmailTemplate = {
    id: randomUUID(),
    title: (body?.title ?? "").toString().trim() || "Untitled email",
    category: (body?.category ?? "Other").toString(),
    body: (body?.body ?? "").toString(),
    tags: normTags(body?.tags),
    source: (body?.source ?? "manual").toString(),
    createdAt: now,
    updatedAt: now,
  };
  emails.push(item);
  await writeJson("emails.json", emails);
  return NextResponse.json(item, { status: 201 });
}
