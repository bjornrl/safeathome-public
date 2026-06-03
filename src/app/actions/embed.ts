"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  SOURCE_CONFIG,
  SOURCE_TYPES,
  EMBEDDING_MODEL,
  contentHash,
  embedText,
  hasOpenAIKey,
  isEmbeddableSourceType,
  toVectorLiteral,
  type EmbeddableSourceType,
} from "@/lib/embeddings";

export type EmbedResult =
  | { status: "ok" }
  | { status: "skipped"; reason: string }
  | { status: "error"; message: string };

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

/**
 * (Re)embed a single source row. Called inline right after a row is saved.
 * Safe to fire-and-forget: any failure leaves the row without a current
 * embedding, which the admin "missing embeddings" panel / backfill repairs.
 */
export async function embedSource(
  sourceType: string,
  sourceId: string,
): Promise<EmbedResult> {
  if (!hasOpenAIKey()) return { status: "skipped", reason: "no_api_key" };
  if (!isEmbeddableSourceType(sourceType)) {
    return { status: "error", message: `unknown source_type: ${sourceType}` };
  }

  const { supabase, userId } = await getUserId();
  if (!userId) return { status: "skipped", reason: "unauthenticated" };

  const cfg = SOURCE_CONFIG[sourceType];
  const { data: row, error: readErr } = await supabase
    .from(cfg.table)
    .select(cfg.select)
    .eq("id", sourceId)
    .maybeSingle();

  if (readErr) return { status: "error", message: readErr.message };
  if (!row) return { status: "skipped", reason: "row_not_found" };

  const content = cfg.build(row as unknown as Record<string, unknown>).trim();

  // Nothing meaningful to embed — clear any stale vector and stop.
  if (!content) {
    await supabase
      .from("embeddings")
      .delete()
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);
    return { status: "skipped", reason: "empty_content" };
  }

  const hash = contentHash(content);

  // Skip if the content (and model) is unchanged since last embed.
  const { data: existing } = await supabase
    .from("embeddings")
    .select("content_hash")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .eq("chunk_index", 0)
    .maybeSingle();
  if (existing && (existing as { content_hash: string }).content_hash === hash) {
    return { status: "skipped", reason: "unchanged" };
  }

  let vector: number[];
  try {
    vector = await embedText(content);
  } catch (err) {
    console.warn("[embed] OpenAI call failed:", err);
    return { status: "error", message: (err as Error).message };
  }

  const { error: upErr } = await supabase.from("embeddings").upsert(
    {
      source_type: sourceType,
      source_id: sourceId,
      chunk_index: 0,
      content,
      content_hash: hash,
      embedding: toVectorLiteral(vector),
      model: EMBEDDING_MODEL,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "source_type,source_id,chunk_index" },
  );
  if (upErr) return { status: "error", message: upErr.message };

  return { status: "ok" };
}

/** Drop a source's embedding(s). Call on delete. */
export async function removeEmbedding(
  sourceType: string,
  sourceId: string,
): Promise<void> {
  if (!isEmbeddableSourceType(sourceType)) return;
  const { supabase, userId } = await getUserId();
  if (!userId) return;
  await supabase
    .from("embeddings")
    .delete()
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);
}

export type MissingCounts = Record<EmbeddableSourceType, number> & { total: number };

/** Count source rows that have no embedding yet, per type. */
export async function countMissingEmbeddings(): Promise<MissingCounts> {
  const { supabase, userId } = await getUserId();
  const empty = SOURCE_TYPES.reduce(
    (acc, t) => ({ ...acc, [t]: 0 }),
    { total: 0 } as MissingCounts,
  );
  if (!userId) return empty;

  const out = { ...empty };
  for (const sourceType of SOURCE_TYPES) {
    const cfg = SOURCE_CONFIG[sourceType];
    const [{ data: srcRows }, { data: embRows }] = await Promise.all([
      supabase.from(cfg.table).select("id"),
      supabase.from("embeddings").select("source_id").eq("source_type", sourceType),
    ]);
    const have = new Set((embRows ?? []).map((r) => (r as { source_id: string }).source_id));
    const missing = (srcRows ?? []).filter(
      (r) => !have.has((r as { id: string }).id),
    ).length;
    out[sourceType] = missing;
    out.total += missing;
  }
  return out;
}

export type EmbedMissingResult = {
  attempted: number;
  embedded: number;
  errors: number;
  remaining: number;
};

/**
 * Embed up to `limit` rows that currently lack an embedding. The admin panel
 * calls this repeatedly until `remaining` reaches 0. Batched to keep each
 * request short.
 */
export async function embedMissing(limit = 20): Promise<EmbedMissingResult> {
  if (!hasOpenAIKey()) return { attempted: 0, embedded: 0, errors: 0, remaining: 0 };
  const { supabase, userId } = await getUserId();
  if (!userId) return { attempted: 0, embedded: 0, errors: 0, remaining: 0 };

  // Collect missing (type, id) pairs across all source types, up to `limit`.
  const todo: { sourceType: EmbeddableSourceType; id: string }[] = [];
  let remaining = 0;

  for (const sourceType of SOURCE_TYPES) {
    const cfg = SOURCE_CONFIG[sourceType];
    const [{ data: srcRows }, { data: embRows }] = await Promise.all([
      supabase.from(cfg.table).select("id"),
      supabase.from("embeddings").select("source_id").eq("source_type", sourceType),
    ]);
    const have = new Set((embRows ?? []).map((r) => (r as { source_id: string }).source_id));
    for (const r of srcRows ?? []) {
      const id = (r as { id: string }).id;
      if (have.has(id)) continue;
      if (todo.length < limit) todo.push({ sourceType, id });
      else remaining += 1;
    }
  }

  let embedded = 0;
  let errors = 0;
  for (const { sourceType, id } of todo) {
    const res = await embedSource(sourceType, id);
    if (res.status === "ok") embedded += 1;
    else if (res.status === "error") errors += 1;
  }

  return { attempted: todo.length, embedded, errors, remaining };
}
