import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/store";
import { parseCsv } from "@/lib/csv";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

const HUNTER_API =
  "https://api.github.com/repos/mrglennc64/hunter/contents/data";

// Pull lead CSVs from the hunter repo and turn each row into a Contact.
// Re-running refreshes: existing "hunter"-tagged contacts are replaced.
export async function POST() {
  // 1. List the data dir.
  const listRes = await fetch(HUNTER_API, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!listRes.ok) {
    return NextResponse.json(
      { error: `hunter list failed (${listRes.status})` },
      { status: 502 },
    );
  }
  const items: Array<{ name: string; download_url: string }> =
    await listRes.json();
  const csvs = items.filter(
    (it) =>
      it.name.toLowerCase().endsWith(".csv") &&
      !it.name.toLowerCase().includes("_template"),
  );

  const idx = (headers: string[], names: string[]) =>
    headers.findIndex((h) => names.includes(h.trim().toLowerCase()));

  const fresh: Contact[] = [];
  const seen = new Set<string>();
  const filesUsed: string[] = [];
  const now = new Date().toISOString();

  for (const file of csvs) {
    let text: string;
    try {
      const r = await fetch(file.download_url);
      if (!r.ok) continue;
      text = await r.text();
    } catch {
      continue;
    }
    const rows = parseCsv(text);
    if (rows.length < 2) continue;
    const headers = rows[0].map((h) => h.trim());
    const lc = headers.map((h) => h.toLowerCase());

    const iName = idx(lc, ["artist", "name"]);
    const iTrack = idx(lc, ["track", "title", "song"]);
    const iEmail = idx(lc, ["email"]);
    const iPhone = idx(lc, ["phone"]);
    const iCompany = idx(lc, ["company", "label", "publisher"]);
    const iIsrc = idx(lc, ["isrc"]);
    const iScore = idx(lc, ["sniper_score", "score"]);
    const iRecovery = idx(lc, ["estimated_recovery", "recovery"]);
    const iNotes = idx(lc, ["manual_check_notes", "notes"]);
    const tagCols = ["source", "chart", "list", "eligibility"]
      .map((n) => lc.indexOf(n))
      .filter((n) => n >= 0);
    const linkCols = lc
      .map((h, i) => (h.endsWith("_link") ? i : -1))
      .filter((i) => i >= 0);

    if (iName < 0) continue;
    filesUsed.push(file.name);

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = (row[iName] ?? "").trim();
      if (!name) continue;
      const track = iTrack >= 0 ? (row[iTrack] ?? "").trim() : "";
      const key = `${name}|${track}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const tags = ["hunter"];
      for (const c of tagCols) {
        const v = (row[c] ?? "").trim();
        if (v) tags.push(v);
      }

      const noteParts: string[] = [];
      if (track) noteParts.push(`Track: ${track}`);
      if (iIsrc >= 0 && row[iIsrc]?.trim()) noteParts.push(`ISRC: ${row[iIsrc].trim()}`);
      if (iScore >= 0 && row[iScore]?.trim()) noteParts.push(`Score: ${row[iScore].trim()}`);
      if (iRecovery >= 0 && row[iRecovery]?.trim())
        noteParts.push(`Est. recovery: ${row[iRecovery].trim()}`);
      if (iNotes >= 0 && row[iNotes]?.trim()) noteParts.push(row[iNotes].trim());
      for (const c of linkCols) {
        const v = (row[c] ?? "").trim();
        if (v) noteParts.push(`${headers[c]}: ${v}`);
      }

      fresh.push({
        id: randomUUID(),
        name,
        email: iEmail >= 0 ? (row[iEmail] ?? "").trim() : "",
        phone: iPhone >= 0 ? (row[iPhone] ?? "").trim() : "",
        company: iCompany >= 0 ? (row[iCompany] ?? "").trim() : "",
        tags,
        notes: noteParts.join(" | "),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Replace previous hunter-sourced contacts; keep everything else.
  const existing = await readJson<Contact[]>("contacts.json");
  const kept = existing.filter((c) => !c.tags?.includes("hunter"));
  const merged = [...kept, ...fresh];
  await writeJson("contacts.json", merged);

  return NextResponse.json({
    added: fresh.length,
    files: filesUsed,
    total: merged.length,
  });
}
