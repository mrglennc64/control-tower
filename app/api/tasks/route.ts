import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const tasks = await readJson<Task[]>("tasks.json");
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tasks = await readJson<Task[]>("tasks.json");
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: body.title ?? "Untitled",
    component: body.component ?? "",
    priority: body.priority ?? "Medium",
    estimate: body.estimate ?? "",
    dependencies: body.dependencies ?? "",
    repo: body.repo ?? "",
    column: body.column ?? "Backlog",
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(task);
  await writeJson("tasks.json", tasks);
  return NextResponse.json(task, { status: 201 });
}
