import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai";
import { loadSkill } from "@/lib/skills";

export const dynamic = "force-dynamic";

// Draft a short outreach message for a contact, using the AI gateway.
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

  const context: string =
    typeof body?.context === "string" && body.context.trim()
      ? body.context.trim()
      : "Goal: open a conversation.";

  const playbook = await loadSkill("cold-email");
  const system = [
    "You are an expert cold/outreach email writer. Apply this playbook:",
    playbook,
    "",
    "TASK OVERRIDE — this is a one-shot draft, not a conversation:",
    "- Do NOT ask the user any questions. Use ONLY the facts provided below.",
    "- Never leave placeholders like [Name] or [Company].",
    "- Keep it to 3–5 sentences, under 120 words.",
    "- Output ONLY the email body — no subject line, no preamble, no sign-off block.",
  ].join("\n");

  const result = await chat([
    { role: "system", content: system },
    {
      role: "user",
      content: `Draft a first-touch outreach message to:\n${facts}\n\n${context}`,
    },
  ]);

  return NextResponse.json(result);
}
