import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import { scoreLead } from "@/lib/ai";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Score up to `limit` not-yet-scored contacts per call (kept small so it stays
// under proxy timeouts and free-tier rate limits). The client loops until
// remaining === 0, showing progress.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const limit = Math.max(1, Math.min(12, Number(body?.limit) || 8));

  const contacts = await readJson<Contact[]>("contacts.json");
  const targets = contacts.filter((c) => !c.aiScore).slice(0, limit);

  let scored = 0;
  for (const c of targets) {
    try {
      const out = await scoreLead(c);
      if (out.score > 0 || out.summary) {
        c.aiSummary = out.summary;
        c.aiScore = out.score;
        c.updatedAt = new Date().toISOString();
        scored++;
      }
    } catch {
      // skip this one; client can retry the batch
    }
  }
  await writeJson("contacts.json", contacts);

  const remaining = contacts.filter((c) => !c.aiScore).length;
  return NextResponse.json({ scored, remaining, total: contacts.length });
}
