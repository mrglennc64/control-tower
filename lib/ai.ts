// Server-side AI gateway: multiple free-tier providers, round-robin rotation,
// automatic fallback to the next provider on error / rate-limit (429).
// Keys live in DATA_DIR/ai-providers.json (gitignored, behind Basic Auth) —
// never in the repo or the export bundle.
import { readJson, writeJson } from "./store";

export interface AIProvider {
  id: string;
  label: string;
  baseUrl: string; // OpenAI-compatible base, e.g. https://openrouter.ai/api/v1
  model: string;
  apiKey: string;
  enabled: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  text: string;
  provider: string;
  model: string;
  tried: { id: string; error: string }[];
}

// All five providers expose OpenAI-compatible /chat/completions endpoints.
const DEFAULTS: AIProvider[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "google/gemma-4-31b-it:free",
    apiKey: "",
    enabled: true,
  },
  {
    id: "gemini",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
    apiKey: "",
    enabled: true,
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    apiKey: "",
    enabled: true,
  },
  {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-small-latest",
    apiKey: "",
    enabled: true,
  },
  {
    id: "cerebras",
    label: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    model: "llama-3.3-70b",
    apiKey: "",
    enabled: true,
  },
];

export async function getProviders(): Promise<AIProvider[]> {
  const p = await readJson<AIProvider[] | null>("ai-providers.json");
  if (!Array.isArray(p) || p.length === 0) {
    await writeJson("ai-providers.json", DEFAULTS);
    return DEFAULTS;
  }
  return p;
}

export async function saveProviders(next: AIProvider[]): Promise<void> {
  await writeJson("ai-providers.json", next);
}

async function callProvider(
  p: AIProvider,
  messages: ChatMessage[],
): Promise<string> {
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${p.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: p.model, messages, max_tokens: 1024 }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body.slice(0, 160)}`);
  }
  const j = await res.json();
  const text: string = j?.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("empty response");
  return text;
}

// Round-robin start index persisted so load spreads across providers.
async function nextCursor(len: number): Promise<number> {
  const c = await readJson<{ i: number } | null>("ai-cursor.json");
  const i = c && typeof c.i === "number" ? c.i : 0;
  await writeJson("ai-cursor.json", { i: i + 1 });
  return len > 0 ? i % len : 0;
}

export async function chat(
  messages: ChatMessage[],
  opts?: { only?: string },
): Promise<ChatResult> {
  const all = await getProviders();
  const usable = all.filter(
    (p) => p.enabled && p.apiKey && (!opts?.only || p.id === opts.only),
  );
  const tried: { id: string; error: string }[] = [];
  if (usable.length === 0) {
    tried.push({
      id: "none",
      error:
        "No enabled providers with API keys. Add a key in Settings, or use the Puter (no-key) fallback.",
    });
    return { text: "", provider: "", model: "", tried };
  }
  // Rotate the order so each call starts at a different provider.
  const start = opts?.only ? 0 : await nextCursor(usable.length);
  const ordered = [...usable.slice(start), ...usable.slice(0, start)];

  for (const p of ordered) {
    try {
      const text = await callProvider(p, messages);
      return { text, provider: p.label, model: p.model, tried };
    } catch (e) {
      tried.push({ id: p.id, error: (e as Error).message });
    }
  }
  return { text: "", provider: "", model: "", tried };
}
