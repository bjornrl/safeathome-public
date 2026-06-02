"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  SOURCE_TYPES,
  embedText,
  hasOpenAIKey,
  isEmbeddableSourceType,
  toVectorLiteral,
  type EmbeddableSourceType,
} from "@/lib/embeddings";
import type { SearchHit, SearchResponse } from "@/lib/search-types";

type RawHit = {
  source_type: string;
  source_id: string;
  content: string;
  score?: number;
};

export async function semanticSearch(
  query: string,
  sourceTypes?: string[],
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { status: "empty" };

  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getUser();
  if (!sessionData.user?.id) return { status: "unauthenticated" };

  const filter =
    sourceTypes && sourceTypes.length > 0
      ? sourceTypes.filter(isEmbeddableSourceType)
      : null;

  let raw: RawHit[] = [];
  let mode: "hybrid" | "keyword" = "keyword";

  try {
    if (hasOpenAIKey()) {
      const vector = await embedText(trimmed);
      const { data, error } = await supabase.rpc("search_embeddings", {
        query_text: trimmed,
        query_embedding: toVectorLiteral(vector),
        match_count: 25,
        filter_source_types: filter,
      });
      if (error) throw new Error(error.message);
      raw = (data ?? []) as RawHit[];
      mode = "hybrid";
    } else {
      // Keyword-only fallback: still useful when OPENAI_API_KEY is unset.
      let q = supabase
        .from("embeddings")
        .select("source_type, source_id, content")
        .textSearch("content_tsv", trimmed, { type: "websearch", config: "norwegian" })
        .limit(25);
      if (filter) q = q.in("source_type", filter);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      raw = (data ?? []).map((r, i) => ({ ...(r as RawHit), score: 1 / (i + 1) }));
      mode = "keyword";
    }
  } catch (err) {
    console.warn("[search] failed:", err);
    return { status: "error", message: (err as Error).message };
  }

  if (raw.length === 0) return { status: "ok", hits: [], mode };

  const hits = await hydrate(supabase, raw);
  return { status: "ok", hits, mode };
}

// Resolve display title + link for each hit by batch-fetching the source rows.
async function hydrate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  raw: RawHit[],
): Promise<SearchHit[]> {
  const idsByType = new Map<EmbeddableSourceType, Set<string>>();
  for (const r of raw) {
    if (!isEmbeddableSourceType(r.source_type)) continue;
    if (!idsByType.has(r.source_type)) idsByType.set(r.source_type, new Set());
    idsByType.get(r.source_type)!.add(r.source_id);
  }

  // type -> id -> { title, href }
  const meta = new Map<string, { title: string; href: string | null }>();
  const key = (t: string, id: string) => `${t}:${id}`;

  await Promise.all(
    SOURCE_TYPES.map(async (t) => {
      const ids = idsByType.get(t);
      if (!ids || ids.size === 0) return;
      const idList = [...ids];

      if (t === "story") {
        const { data } = await supabase
          .from("public_stories")
          .select("id, title")
          .in("id", idList);
        for (const r of data ?? []) {
          const row = r as { id: string; title: string };
          meta.set(key(t, row.id), { title: row.title, href: `/story/${row.id}` });
        }
      } else if (t === "insight") {
        const { data } = await supabase
          .from("insights")
          .select("id, title")
          .in("id", idList);
        for (const r of data ?? []) {
          const row = r as { id: string; title: string };
          meta.set(key(t, row.id), { title: row.title, href: null });
        }
      } else if (t === "quick_note") {
        const { data } = await supabase
          .from("quick_notes")
          .select("id, headline, body")
          .in("id", idList);
        for (const r of data ?? []) {
          const row = r as { id: string; headline: string | null; body: string };
          meta.set(key(t, row.id), {
            title: row.headline?.trim() || row.body.slice(0, 60) || "(uten tittel)",
            href: null,
          });
        }
      } else if (t === "resource") {
        const { data } = await supabase
          .from("public_resources")
          .select("id, title, url")
          .in("id", idList);
        for (const r of data ?? []) {
          const row = r as { id: string; title: string; url: string | null };
          meta.set(key(t, row.id), { title: row.title, href: row.url });
        }
      }
    }),
  );

  return raw
    .filter((r) => isEmbeddableSourceType(r.source_type))
    .map((r) => {
      const m = meta.get(key(r.source_type, r.source_id));
      return {
        sourceType: r.source_type as EmbeddableSourceType,
        sourceId: r.source_id,
        title: m?.title ?? "(slettet)",
        snippet: snippetFrom(r.content, m?.title),
        href: m?.href ?? null,
        score: r.score ?? 0,
      };
    })
    // Drop hits whose source row no longer exists (deleted but not yet pruned).
    .filter((h) => h.title !== "(slettet)");
}

// The embedded content begins with the title; strip it so the snippet shows body.
function snippetFrom(content: string, title?: string): string {
  let body = content;
  if (title && body.startsWith(title)) body = body.slice(title.length);
  return body.replace(/\s+/g, " ").trim().slice(0, 220);
}
