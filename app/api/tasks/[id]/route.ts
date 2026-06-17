import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const tasks = await readJson<Task[]>("tasks.json");
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // Whitelist editable fields; never let id/createdAt be overwritten.
  const editable: (keyof Task)[] = [
    "title",
    "component",
    "priority",
    "estimate",
    "dependencies",
    "repo",
    "column",
    "notes",
  ];
  for (const key of editable) {
    if (key in patch) {
      (tasks[idx] as unknown as Record<string, unknown>)[key] = patch[key];
    }
  }
  tasks[idx].updatedAt = new Date().toISOString();
  await writeJson("tasks.json", tasks);
  return NextResponse.json(tasks[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const tasks = await readJson<Task[]>("tasks.json");
  const next = tasks.filter((t) => t.id !== id);
  if (next.length === tasks.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeJson("tasks.json", next);
  return NextResponse.json({ ok: true });
}
