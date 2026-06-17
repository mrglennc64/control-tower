import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { DocumentItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const documents = await readJson<DocumentItem[]>("documents.json");
  const idx = documents.findIndex((d) => d.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const editable: (keyof DocumentItem)[] = [
    "title",
    "type",
    "location",
    "tags",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      if (key === "tags") {
        documents[idx].tags = normalizeTags(patch.tags);
      } else {
        documents[idx][key] = patch[key];
      }
    }
  }
  documents[idx].updatedAt = new Date().toISOString();
  await writeJson("documents.json", documents);
  return NextResponse.json(documents[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const documents = await readJson<DocumentItem[]>("documents.json");
  const next = documents.filter((d) => d.id !== id);
  if (next.length === documents.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("documents.json", next);
  return NextResponse.json({ ok: true });
}
