import { promises as fs } from "fs";
import path from "path";

// Vendored marketing skill playbooks live in lib/skills/*.md (see that
// folder's README for attribution). They're injected as system-prompt
// context to sharpen the app's AI features.
const DIR = path.join(process.cwd(), "lib", "skills");

// Load a skill playbook: strip YAML frontmatter and cap length so the
// injected text stays within small free-tier model context windows.
export async function loadSkill(name: string, maxChars = 6000): Promise<string> {
  try {
    const raw = await fs.readFile(path.join(DIR, `${name}.md`), "utf8");
    const body = raw.replace(/^---[\s\S]*?---\s*/, "").trim();
    return body.length > maxChars
      ? body.slice(0, maxChars) + "\n…(playbook truncated)"
      : body;
  } catch {
    return ""; // missing skill — caller falls back to its own instructions
  }
}
