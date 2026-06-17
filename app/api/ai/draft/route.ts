import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai";

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

  const result = await chat([
    {
      role: "system",
      content:
        "You write concise, personalized B2B outreach messages (3–5 sentences, under 120 words). " +
        "Warm, specific, professional. Use the real details provided — never leave placeholders like [Name]. " +
        "Output ONLY the message body, no subject line, no preamble.",
    },
    {
      role: "user",
      content: `Draft a first-touch outreach message to this contact:\n${facts}\n\nGoal: open a conversation.`,
    },
  ]);

  return NextResponse.json(result);
}
