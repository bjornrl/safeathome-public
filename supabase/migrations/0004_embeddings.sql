-- Phase: semantic search (ADR 0001)
--
-- Generic embeddings index over the research corpus, stored in-stack via
-- pgvector. One row per (source_type, source_id, chunk_index). v1 stores a
-- single chunk (chunk_index = 0) per source; PDF chunking (slice 2) will add
-- chunk_index > 0 rows under the same schema.
--
-- RLS follows the existing pattern but is intentionally STRICTER than the
-- public_* tables: there is NO anon policy. The content column holds raw,
-- unpublished field notes, and v1 search is authenticated-only (/internal).
-- When public semantic features (slice G) arrive, add a narrow anon SELECT
-- policy scoped to published-story embeddings only.

-- ════════════════════════════════════════════════════════════════
-- 0. Extension
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- ════════════════════════════════════════════════════════════════
-- 1. embeddings table
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  TEXT NOT NULL CHECK (source_type IN ('insight', 'quick_note', 'story', 'resource')),
  source_id    UUID NOT NULL,
  chunk_index  INT  NOT NULL DEFAULT 0,
  content      TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding    VECTOR(1536),
  model        TEXT NOT NULL DEFAULT 'text-embedding-3-large',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, source_id, chunk_index)
);

-- Norwegian full-text vector, maintained automatically from content.
ALTER TABLE public.embeddings
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('norwegian', content)) STORED;

-- ════════════════════════════════════════════════════════════════
-- 2. Indexes
-- ════════════════════════════════════════════════════════════════

-- Keyword half of the hybrid search.
CREATE INDEX IF NOT EXISTS embeddings_tsv_idx
  ON public.embeddings USING gin (content_tsv);

-- Vector half. HNSW with cosine distance. (1536 dims is within the 2000-dim
-- index ceiling — this is why the OpenAI call requests dimensions: 1536.)
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx
  ON public.embeddings USING hnsw (embedding vector_cosine_ops);

-- Fast lookup / dedupe by source.
CREATE INDEX IF NOT EXISTS embeddings_source_idx
  ON public.embeddings (source_type, source_id);

-- ════════════════════════════════════════════════════════════════
-- 3. Row-level security
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- authenticated: full CRUD (mirrors existing internal-table posture).
DROP POLICY IF EXISTS auth_all ON public.embeddings;
CREATE POLICY auth_all ON public.embeddings
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- NOTE: deliberately no anon policy. anon callers get zero rows.

-- ════════════════════════════════════════════════════════════════
-- 4. Hybrid search RPC (vector + FTS, reciprocal-rank fusion)
-- ════════════════════════════════════════════════════════════════
--
-- SECURITY INVOKER (default): runs as the calling role, so RLS applies and an
-- anon caller retrieves nothing. Returns the fused top `match_count`.

CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_text          TEXT,
  query_embedding     VECTOR(1536),
  match_count         INT DEFAULT 20,
  filter_source_types TEXT[] DEFAULT NULL,
  rrf_k               INT DEFAULT 60
)
RETURNS TABLE (
  source_type TEXT,
  source_id   UUID,
  chunk_index INT,
  content     TEXT,
  vector_rank INT,
  fts_rank    INT,
  score       DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  WITH vec AS (
    SELECT e.source_type, e.source_id, e.chunk_index, e.content,
           ROW_NUMBER() OVER (ORDER BY e.embedding <=> query_embedding) AS rank
    FROM public.embeddings e
    WHERE e.embedding IS NOT NULL
      AND (filter_source_types IS NULL OR e.source_type = ANY (filter_source_types))
    ORDER BY e.embedding <=> query_embedding
    LIMIT GREATEST(match_count * 3, 30)
  ),
  fts AS (
    SELECT e.source_type, e.source_id, e.chunk_index, e.content,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank(e.content_tsv, websearch_to_tsquery('norwegian', query_text)) DESC
           ) AS rank
    FROM public.embeddings e
    WHERE COALESCE(query_text, '') <> ''
      AND e.content_tsv @@ websearch_to_tsquery('norwegian', query_text)
      AND (filter_source_types IS NULL OR e.source_type = ANY (filter_source_types))
    ORDER BY rank
    LIMIT GREATEST(match_count * 3, 30)
  )
  SELECT
    COALESCE(vec.source_type, fts.source_type)  AS source_type,
    COALESCE(vec.source_id,   fts.source_id)    AS source_id,
    COALESCE(vec.chunk_index, fts.chunk_index)  AS chunk_index,
    COALESCE(vec.content,     fts.content)       AS content,
    vec.rank::INT                                AS vector_rank,
    fts.rank::INT                                AS fts_rank,
    (COALESCE(1.0 / (rrf_k + vec.rank), 0)
       + COALESCE(1.0 / (rrf_k + fts.rank), 0)) AS score
  FROM vec
  FULL OUTER JOIN fts
    ON vec.source_type = fts.source_type
   AND vec.source_id   = fts.source_id
   AND vec.chunk_index = fts.chunk_index
  ORDER BY score DESC
  LIMIT match_count;
$$;

-- ════════════════════════════════════════════════════════════════
-- 5. Nearest-neighbour RPC (pure vector) for connection autosuggest
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.match_embeddings(
  query_embedding     VECTOR(1536),
  match_count         INT DEFAULT 15,
  filter_source_types TEXT[] DEFAULT NULL,
  exclude_source_id   UUID DEFAULT NULL
)
RETURNS TABLE (
  source_type TEXT,
  source_id   UUID,
  chunk_index INT,
  content     TEXT,
  similarity  DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT e.source_type, e.source_id, e.chunk_index, e.content,
         1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  WHERE e.embedding IS NOT NULL
    AND (filter_source_types IS NULL OR e.source_type = ANY (filter_source_types))
    AND (exclude_source_id IS NULL OR e.source_id <> exclude_source_id)
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
