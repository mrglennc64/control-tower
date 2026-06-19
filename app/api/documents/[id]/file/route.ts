import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readJson, uploadsDir } from "@/lib/store";
import type { DocumentItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Stream an uploaded document file inline so the browser can display it
// (PDFs, images, text). ?download=1 forces a download instead.
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const documents = await readJson<DocumentItem[]>("documents.json");
  const doc = documents.find((d) => d.id === id);
  if (!doc || !doc.file) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const dir = await uploadsDir();
  let bytes: Buffer;
  try {
    bytes = await fs.readFile(path.join(dir, doc.file.stored));
  } catch {
    return NextResponse.json({ error: "file missing on disk" }, { status: 404 });
  }
  const download = req.nextUrl.searchParams.get("download") === "1";
  const disp = download ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.file.mime || "application/octet-stream",
      "Content-Disposition": `${disp}; filename="${encodeURIComponent(doc.file.name)}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
