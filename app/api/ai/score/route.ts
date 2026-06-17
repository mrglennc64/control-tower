import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Summarize + score a lead/contact. Returns { summary, score, provider, model }.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const c = body?.contact ?? {};
  const facts = [
    c.name && `Name: ${c.name}`,
    c.company && `Company: ${c.company}`,
    c.email && `Email: ${c.email}`,
    Array.isArray(c.tags) && c.tags.length && `Tags: ${c.tags.join(", ")}`,
    c.notes && `Notes: ${c.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await chat([
    {
      role: "system",
      content:
        'You analyze an outreach lead and respond with STRICT JSON ONLY, no markdown, no prose: ' +
        '{"summary": "<=15 word summary", "score": <integer 1-5, 5 = highest priority/fit>}.',
    },
    { role: "user", content: `Lead:\n${facts}\n\nReturn the JSON.` },
  ]);

  let summary = "";
  let score = 0;
  const match = result.text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const o = JSON.parse(match[0]);
      summary = String(o.summary ?? "").slice(0, 200);
      score = Math.max(0, Math.min(5, Math.round(Number(o.score) || 0)));
    } catch {
      /* fall through */
    }
  }
  if (!summary) summary = result.text.trim().slice(0, 200);

  return NextResponse.json({
    summary,
    score,
    provider: result.provider,
    model: result.model,
    tried: result.tried,
  });
}
