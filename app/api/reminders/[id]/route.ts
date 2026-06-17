import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Reminder } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const reminders = await readJson<Reminder[]>("reminders.json");
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const editable: (keyof Reminder)[] = [
    "title",
    "dueDate",
    "type",
    "done",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      // @ts-expect-error indexed assignment across union is safe per whitelist
      reminders[idx][key] = patch[key];
    }
  }
  reminders[idx].updatedAt = new Date().toISOString();
  await writeJson("reminders.json", reminders);
  return NextResponse.json(reminders[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const reminders = await readJson<Reminder[]>("reminders.json");
  const next = reminders.filter((r) => r.id !== id);
  if (next.length === reminders.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("reminders.json", next);
  return NextResponse.json({ ok: true });
}
