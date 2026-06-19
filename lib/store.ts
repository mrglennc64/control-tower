import { promises as fs } from "fs";
import path from "path";
import os from "os";
import {
  SEED_PRODUCTS,
  SEED_BUYERS,
  SEED_META,
  SEED_REMINDERS,
  SEED_DOCUMENTS,
  SEED_FINANCE,
  SEED_TASKS,
  SEED_ENTITIES,
  SEED_MILESTONES,
  SEED_CONTACTS,
  SEED_CHATS,
  SEED_STRATEGY,
  SEED_SUBSCRIPTIONS,
  SEED_CLAIMS,
  SEED_CREDIT_TASKS,
  SEED_CREDIT_ACCOUNTS,
  SEED_CREDIT_PROFILE,
} from "./seed";

// --- Data location -------------------------------------------------------
// Defaults to the OneDrive mailman/data folder so files auto-sync across
// machines. Override with the DATA_DIR env var (see .env.local.example).
function dataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  return path.join(
    os.homedir(),
    "OneDrive",
    "Dokument",
    "mailman",
    "data",
  );
}

const SEEDS: Record<string, unknown> = {
  "products.json": SEED_PRODUCTS,
  "buyers.json": SEED_BUYERS,
  "reminders.json": SEED_REMINDERS,
  "documents.json": SEED_DOCUMENTS,
  "finance.json": SEED_FINANCE,
  "tasks.json": SEED_TASKS,
  "entities.json": SEED_ENTITIES,
  "milestones.json": SEED_MILESTONES,
  "contacts.json": SEED_CONTACTS,
  "chats.json": SEED_CHATS,
  "strategy.json": SEED_STRATEGY,
  "subscriptions.json": SEED_SUBSCRIPTIONS,
  "claims.json": SEED_CLAIMS,
  "credit-tasks.json": SEED_CREDIT_TASKS,
  "credit-accounts.json": SEED_CREDIT_ACCOUNTS,
  "credit-profile.json": SEED_CREDIT_PROFILE,
  "meta.json": SEED_META,
};

// --- Per-file write lock -------------------------------------------------
// Serialize writes to each file so two rapid edits can't interleave and
// corrupt the JSON. Reads are not locked (atomic rename makes them safe).
const locks = new Map<string, Promise<unknown>>();

function withLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(file) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(
    file,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

async function ensureDir(): Promise<string> {
  const dir = dataDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Read a JSON file; if it doesn't exist yet, seed it and return the seed.
export async function readJson<T>(file: string): Promise<T> {
  const dir = await ensureDir();
  const full = path.join(dir, file);
  try {
    const raw = await fs.readFile(full, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const seed = (SEEDS[file] ?? null) as T;
      await writeJson(file, seed);
      return seed;
    }
    throw err;
  }
}

// Atomic write: write to a temp file, then rename over the target.
export async function writeJson(file: string, data: unknown): Promise<void> {
  await withLock(file, async () => {
    const dir = await ensureDir();
    const full = path.join(dir, file);
    const tmp = path.join(dir, `.${file}.${process.pid}.tmp`);
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, full);
  });
}

// Snapshot all data files into data/backups/<timestamp>/ (called on startup).
export async function backup(stamp: string): Promise<void> {
  const dir = await ensureDir();
  const dest = path.join(dir, "backups", stamp);
  await fs.mkdir(dest, { recursive: true });
  for (const file of Object.keys(SEEDS)) {
    try {
      const raw = await fs.readFile(path.join(dir, file), "utf8");
      await fs.writeFile(path.join(dest, file), raw, "utf8");
    } catch {
      // file may not exist yet on first run — skip
    }
  }
}

// Directory for uploaded binary files (documents, etc.). Lives next to the
// JSON data so it syncs/backs up with everything else.
export async function uploadsDir(): Promise<string> {
  const dir = path.join(dataDir(), "uploads");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export { dataDir };
