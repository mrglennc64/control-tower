import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { readJson, writeJson, uploadsDir } from "@/lib/store";
import type { DocumentItem, DocType } from "@/lib/types";

export const dynamic = "force-dynamic";

// Reject anything wildly large to keep the JSON store and disk sane.
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
}

function normalizeTags(input: unknown): string[] {
  if (typeof input === "string") {
    return input.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 413 });
  }

  const origName = (file as File).name || "file";
  const id = randomUUID();
  const stored = `${id}__${safeName(origName)}`;
  const dir = await uploadsDir();
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, stored), bytes);

  const now = new Date().toISOString();
  const documents = await readJson<DocumentItem[]>("documents.json");
  const doc: DocumentItem = {
    id,
    title: String(form.get("title") || origName),
    type: (String(form.get("type") || "Other") as DocType),
    location: "",
    file: {
      stored,
      name: origName,
      mime: file.type || "application/octet-stream",
      size: file.size,
    },
    tags: normalizeTags(form.get("tags")),
    notes: String(form.get("notes") || ""),
    addedAt: now,
    updatedAt: now,
  };
  documents.push(doc);
  await writeJson("documents.json", documents);
  return NextResponse.json(doc, { status: 201 });
}
