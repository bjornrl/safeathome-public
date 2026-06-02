import "server-only";
import { createHash } from "node:crypto";

// Embedding model config. Stored on every row so we can re-embed on a swap.
// dimensions:1536 keeps the vector under pgvector's 2000-dim index ceiling
// (text-embedding-3-large is natively 3072) — see ADR 0001.
export const EMBEDDING_MODEL = "text-embedding-3-large";
export const EMBEDDING_DIMENSIONS = 1536;

export type EmbeddableSourceType = "insight" | "quick_note" | "story" | "resource";

export const SOURCE_TYPES: EmbeddableSourceType[] = [
  "insight",
  "quick_note",
  "story",
  "resource",
];

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// Per-source-type config: which table to read, which columns, and how to build
// the canonical text we embed. Keeping this in one place means the inline hook,
// the backfill script, and the admin panel all agree on what gets indexed.
type SourceConfig = {
  table: string;
  select: string;
  build: (row: Record<string, unknown>) => string;
};

function joinParts(...parts: unknown[]): string {
  return parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join("\n\n");
}

export const SOURCE_CONFIG: Record<EmbeddableSourceType, SourceConfig> = {
  insight: {
    table: "insights",
    select: "id, title, body",
    build: (r) => joinParts(r.title, r.body),
  },
  quick_note: {
    table: "quick_notes",
    select: "id, headline, body",
    build: (r) => joinParts(r.headline, r.body),
  },
  story: {
    table: "public_stories",
    select: "id, title, body",
    build: (r) => joinParts(r.title, r.body),
  },
  resource: {
    table: "public_resources",
    select: "id, title, description",
    build: (r) => joinParts(r.title, r.description),
  },
};

export function isEmbeddableSourceType(v: string): v is EmbeddableSourceType {
  return (SOURCE_TYPES as string[]).includes(v);
}

// Stable identity of "what we embedded with which model" — lets us skip
// re-embedding unchanged content.
export function contentHash(content: string): string {
  return createHash("sha256").update(`${EMBEDDING_MODEL}::${content}`).digest("hex");
}

// pgvector accepts a bracketed string literal: "[0.1,0.2,...]".
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

// Single-input embedding via the OpenAI REST API (no SDK dependency).
export async function embedText(input: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const vec = json.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("OpenAI embeddings: malformed response");
  }
  return vec;
}
