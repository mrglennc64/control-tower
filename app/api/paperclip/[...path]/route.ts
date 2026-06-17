import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxy to the local Paperclip orchestrator (127.0.0.1:3100), so the Control
// Tower UI (public, behind Basic Auth) can drive the localhost-only agent API.
const BASE = "http://127.0.0.1:3100/api";

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(req: NextRequest, path: string[], method: string) {
  const url = `${BASE}/${path.join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30000),
  };
  if (method !== "GET" && method !== "DELETE") {
    const body = await req.text();
    if (body) init.body = body;
  }
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Paperclip unreachable: ${(e as Error).message}` },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path, "GET");
}
export async function POST(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path, "POST");
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path, "PATCH");
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path, "DELETE");
}
