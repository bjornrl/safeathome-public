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
import type { SearchHit, SearchHitDetail, SearchResponse } from "@/lib/search-types";
import { RESOURCE_TYPE_LABELS } from "@/lib/seed-resources";
import { SCALES } from "@/lib/constants";
import type {
  CareFriction,
  CareQuality,
  FieldSite,
  HouseTheme,
  MapScale,
  ResourceType,
  WorkPackage,
} from "@/lib/types";

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
    // Try hybrid first when a key is configured. If embedding or the RPC fails
    // at runtime (e.g. an OpenAI 429/outage), degrade to keyword-only rather
    // than failing the whole search — no client-visible failure (ADR 0001).
    if (hasOpenAIKey()) {
      try {
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
      } catch (embedErr) {
        console.warn("[search] hybrid failed, falling back to keyword:", embedErr);
        raw = await keywordSearch(supabase, trimmed, filter);
        mode = "keyword";
      }
    } else {
      raw = await keywordSearch(supabase, trimmed, filter);
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

// Keyword-only path over the Norwegian FTS column. Used when no OpenAI key is
// configured, or as a runtime fallback when embedding/RPC fails.
async function keywordSearch(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  trimmed: string,
  filter: string[] | null,
): Promise<RawHit[]> {
  let q = supabase
    .from("embeddings")
    .select("source_type, source_id, content")
    .textSearch("content_tsv", trimmed, { type: "websearch", config: "norwegian" })
    .limit(25);
  if (filter) q = q.in("source_type", filter);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r, i) => ({ ...(r as RawHit), score: 1 / (i + 1) }));
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

// ─── Hit detail (for the slide-in panel) ────────────────────────
//
// Hydrates the full source row for a single hit. Authenticated-only and
// RLS-enforced, like search itself. Returns null if not signed in or the row
// is gone.

const humanizeTheme = (t: HouseTheme): string => t.replace(/_/g, " ");

export async function getSearchHitDetail(
  sourceType: string,
  sourceId: string,
): Promise<SearchHitDetail | null> {
  if (!isEmbeddableSourceType(sourceType)) return null;

  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getUser();
  if (!sessionData.user?.id) return null;

  const base = { sourceType, sourceId } as const;

  if (sourceType === "quick_note") {
    const { data } = await supabase
      .from("quick_notes")
      .select("id, headline, body, work_package, field_site, house_themes, care_frictions, care_qualities")
      .eq("id", sourceId)
      .maybeSingle();
    if (!data) return null;
    const r = data as {
      headline: string | null;
      body: string;
      work_package: WorkPackage | null;
      field_site: FieldSite | null;
      house_themes: HouseTheme[] | null;
      care_frictions: CareFriction[] | null;
      care_qualities: CareQuality[] | null;
    };
    return {
      ...base,
      title: r.headline?.trim() || r.body.slice(0, 60) || "(uten tittel)",
      body: r.body ?? "",
      href: null,
      external: false,
      workPackage: r.work_package,
      fieldSite: r.field_site,
      frictions: r.care_frictions ?? [],
      qualities: r.care_qualities ?? [],
      tags: (r.house_themes ?? []).map(humanizeTheme),
    };
  }

  if (sourceType === "insight") {
    const { data } = await supabase
      .from("insights")
      .select("id, title, body, work_package, field_site, tags")
      .eq("id", sourceId)
      .maybeSingle();
    if (!data) return null;
    const r = data as {
      title: string;
      body: string;
      work_package: WorkPackage | null;
      field_site: FieldSite | null;
      tags: string[] | null;
    };
    return {
      ...base,
      title: r.title,
      body: r.body ?? "",
      href: null,
      external: false,
      workPackage: r.work_package,
      fieldSite: r.field_site,
      frictions: [],
      qualities: [],
      tags: r.tags ?? [],
    };
  }

  if (sourceType === "story") {
    const { data } = await supabase
      .from("public_stories")
      .select("id, title, body, work_package, field_site, frictions, qualities")
      .eq("id", sourceId)
      .maybeSingle();
    if (!data) return null;
    const r = data as {
      title: string;
      body: string;
      work_package: WorkPackage | null;
      field_site: FieldSite | null;
      frictions: CareFriction[] | null;
      qualities: CareQuality[] | null;
    };
    return {
      ...base,
      title: r.title,
      body: r.body ?? "",
      href: `/story/${sourceId}`,
      external: false,
      workPackage: r.work_package,
      fieldSite: r.field_site,
      frictions: r.frictions ?? [],
      qualities: r.qualities ?? [],
      tags: [],
    };
  }

  // resource
  const { data } = await supabase
    .from("public_resources")
    .select("id, title, description, type, url, field_site, map_scale")
    .eq("id", sourceId)
    .maybeSingle();
  if (!data) return null;
  const r = data as {
    title: string;
    description: string | null;
    type: ResourceType;
    url: string | null;
    field_site: FieldSite | null;
    map_scale: MapScale | null;
  };
  const tags = [
    r.type ? (RESOURCE_TYPE_LABELS[r.type] ?? r.type) : null,
    r.map_scale ? SCALES[r.map_scale].label : null,
  ].filter((t): t is string => Boolean(t));
  return {
    ...base,
    title: r.title,
    body: r.description ?? "",
    href: r.url,
    external: Boolean(r.url && r.url.startsWith("http")),
    workPackage: null,
    fieldSite: r.field_site,
    frictions: [],
    qualities: [],
    tags,
  };
}
