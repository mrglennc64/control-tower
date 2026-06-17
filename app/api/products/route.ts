import { NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await readJson<Product[]>("products.json");
  return NextResponse.json(products);
}
