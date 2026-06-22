// Read the NSS outreach/email deliverables and emit an emails.json the
// Outreach Emails module can load. Run with node; pass the deliverables dir
// and output path as args.
//
//   node scripts/build-emails-json.mjs <deliverablesDir> <outFile>

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const dir = process.argv[2];
const out = process.argv[3];
if (!dir || !out) {
  console.error("usage: build-emails-json.mjs <deliverablesDir> <outFile>");
  process.exit(1);
}

// The outreach/email files, with a clean title + category for each.
const FILES = [
  ["Sales/NOR-3-outreach-sequence.md", "Acquirer outreach — 3-email sequence (NOR-3)", "Sales"],
  ["Sales/NOR-3-wave-1-personalized-outreach.md", "Wave 1 personalized outreach (Valsoft/Alpine/Vitec…)", "Sales"],
  ["Sales/NOR-5-valsoft-alpine-outreach-pack.md", "Valsoft / Alpine outreach pack (NOR-5)", "Sales"],
  ["Sales/NOR-9-email-sequences.md", "Customer sequences — Kataloghub + WebCheck (NOR-9)", "Sales"],
  ["Sales/NOR-10-track-a-customer-outreach-pack.md", "Track A — customer outreach pack (NOR-10)", "Sales"],
  ["Marketing/NOR-2-email-sequence.md", "Kataloghub acquirer sequence (NOR-2)", "Marketing"],
  ["Marketing/NOR-9-customer-email-sequence.md", "Customer email sequence (NOR-9)", "Marketing"],
];

const now = new Date().toISOString();
const items = [];
for (const [rel, title, category] of FILES) {
  const full = path.join(dir, rel);
  let body;
  try {
    body = await fs.readFile(full, "utf8");
  } catch {
    console.warn("skip (missing):", rel);
    continue;
  }
  items.push({
    id: crypto.randomUUID(),
    title,
    category,
    body,
    tags: ["agent", "nss"],
    source: "agent",
    createdAt: now,
    updatedAt: now,
  });
}

await fs.writeFile(out, JSON.stringify(items, null, 2), "utf8");
console.log(`wrote ${items.length} emails to ${out}`);
