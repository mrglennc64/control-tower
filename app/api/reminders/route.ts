import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Reminder } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const reminders = await readJson<Reminder[]>("reminders.json");
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const reminders = await readJson<Reminder[]>("reminders.json");
  const now = new Date().toISOString();
  const reminder: Reminder = {
    id: randomUUID(),
    title: body.title ?? "Untitled reminder",
    dueDate: body.dueDate ?? null,
    type: body.type ?? "Custom",
    done: body.done ?? false,
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  reminders.push(reminder);
  await writeJson("reminders.json", reminders);
  return NextResponse.json(reminder, { status: 201 });
}
