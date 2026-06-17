// Runs once when the server process starts. We take a backup snapshot of the
// data files so a bad edit during a session can always be rolled back.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { backup, writeJson, readJson } = await import("./lib/store");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  try {
    await backup(stamp);
    const meta = await readJson<{ appName: string; lastBackup: string | null }>(
      "meta.json",
    );
    meta.lastBackup = new Date().toISOString();
    await writeJson("meta.json", meta);
  } catch (err) {
    console.error("[control-tower] startup backup failed:", err);
  }
}
