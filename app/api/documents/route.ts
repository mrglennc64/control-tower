import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { DocumentItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((t) => String(t).trim())
      .filter((t) => t.length > 0);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  return [];
}

export async function GET() {
  return NextResponse.json(await readJson<DocumentItem[]>("documents.json"));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const documents = await readJson<DocumentItem[]>("documents.json");
  const now = new Date().toISOString();
  const doc: DocumentItem = {
    id: randomUUID(),
    title: body.title ?? "Untitled",
    type: body.type ?? "Other",
    location: body.location ?? "",
    tags: normalizeTags(body.tags),
    notes: body.notes ?? "",
    addedAt: now,
    updatedAt: now,
  };
  documents.push(doc);
  await writeJson("documents.json", documents);
  return NextResponse.json(doc, { status: 201 });
}
