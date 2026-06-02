// One-time / repair backfill of the embeddings index (ADR 0001).
//
// Embeds every source row that has no current embedding. Safe to re-run — it
// skips rows whose content hash is unchanged. Batched and resumable.
//
// Usage (Node 20.6+):
//   node --env-file=.env.local scripts/backfill-embeddings.mjs
//
// Requires in env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (server-only — bypasses RLS to read/write all rows)
//   OPENAI_API_KEY

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 1536;

if (!SUPABASE_URL || !SERVICE_KEY || !OPENAI_KEY) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Must mirror SOURCE_CONFIG in src/lib/embeddings.ts.
const joinParts = (...parts) =>
  parts.map((p) => (typeof p === "string" ? p.trim() : "")).filter(Boolean).join("\n\n");

const SOURCE_CONFIG = {
  insight: { table: "insights", select: "id, title, body", build: (r) => joinParts(r.title, r.body) },
  quick_note: { table: "quick_notes", select: "id, headline, body", build: (r) => joinParts(r.headline, r.body) },
  story: { table: "public_stories", select: "id, title, body", build: (r) => joinParts(r.title, r.body) },
  resource: { table: "public_resources", select: "id, title, description", build: (r) => joinParts(r.title, r.description) },
};

const contentHash = (content) =>
  createHash("sha256").update(`${EMBEDDING_MODEL}::${content}`).digest("hex");

async function embedText(input) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input, dimensions: EMBEDDING_DIMENSIONS }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const vec = json?.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("malformed embedding response");
  }
  return vec;
}

const toVectorLiteral = (vec) => `[${vec.join(",")}]`;

async function backfillType(sourceType) {
  const cfg = SOURCE_CONFIG[sourceType];

  const [{ data: srcRows, error: srcErr }, { data: embRows, error: embErr }] = await Promise.all([
    supabase.from(cfg.table).select(cfg.select),
    supabase.from("embeddings").select("source_id, content_hash").eq("source_type", sourceType).eq("chunk_index", 0),
  ]);
  if (srcErr) throw new Error(`read ${cfg.table}: ${srcErr.message}`);
  if (embErr) throw new Error(`read embeddings: ${embErr.message}`);

  const existing = new Map((embRows ?? []).map((r) => [r.source_id, r.content_hash]));

  let embedded = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of srcRows ?? []) {
    const content = cfg.build(row).trim();
    if (!content) {
      skipped += 1;
      continue;
    }
    const hash = contentHash(content);
    if (existing.get(row.id) === hash) {
      skipped += 1;
      continue;
    }
    try {
      const vector = await embedText(content);
      const { error } = await supabase.from("embeddings").upsert(
        {
          source_type: sourceType,
          source_id: row.id,
          chunk_index: 0,
          content,
          content_hash: hash,
          embedding: toVectorLiteral(vector),
          model: EMBEDDING_MODEL,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source_type,source_id,chunk_index" },
      );
      if (error) throw new Error(error.message);
      embedded += 1;
      process.stdout.write(".");
    } catch (err) {
      errors += 1;
      console.warn(`\n  [${sourceType}] ${row.id} failed: ${err.message}`);
    }
  }

  console.log(`\n${sourceType}: ${embedded} embedded, ${skipped} skipped, ${errors} errors`);
}

for (const sourceType of Object.keys(SOURCE_CONFIG)) {
  console.log(`\n→ ${sourceType}`);
  await backfillType(sourceType);
}

console.log("\nDone.");
