import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import { chat } from "@/lib/ai";
import type { StrategyNote } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PIN_TITLE = "📌 Synthesized strategy";

// Read all your strategy notes and produce one consolidated, organized strategy,
// saved as a single pinned note that updates each time (so it grows with you).
export async function POST() {
  const notes = await readJson<StrategyNote[]>("strategy.json");
  const source = notes.filter((n) => n.title !== PIN_TITLE);
  if (source.length === 0) {
    return NextResponse.json({ error: "Add some notes first." }, { status: 400 });
  }

  const corpus = source
    .map((n) => `## ${n.title}\n${n.content}`)
    .join("\n\n")
    .slice(0, 12000);

  const res = await chat([
    {
      role: "system",
      content:
        "You are a strategist. Consolidate these raw strategy notes into one clear, organized strategy. " +
        "Use sections (Goals, Key moves, Acquisition/IP sale, Risks, Next actions). Be concise and concrete. " +
        "Merge overlaps, surface themes, and end with a short prioritized action list. Markdown.",
    },
    { role: "user", content: `My strategy notes:\n\n${corpus}` },
  ]);

  if (!res.text) {
    return NextResponse.json(
      { error: "AI returned nothing — check Settings/providers.", tried: res.tried },
      { status: 502 },
    );
  }

  const now = new Date().toISOString();
  const kept = notes.filter((n) => n.title !== PIN_TITLE);
  const pin: StrategyNote = {
    id: randomUUID(),
    title: PIN_TITLE,
    content: res.text,
    tags: ["ai", "synthesis"],
    source: "ai",
    pinned: true,
    createdAt: now,
    updatedAt: now,
  };
  await writeJson("strategy.json", [pin, ...kept]);
  return NextResponse.json({ ok: true, provider: res.provider, model: res.model });
}
