-- Trim hybrid search to the relevant cluster, two ways:
--
--   min_similarity  — an ABSOLUTE floor. Kills off-topic queries entirely
--                     (measured: off-topic notes score ~0.18-0.26, on-topic
--                     ~0.34-0.54, so 0.32 cleanly separates them).
--   relative_margin — a RELATIVE band. Within an on-topic query every note in
--                     a thematically tight corpus scores moderately high, so a
--                     flat floor can't discriminate. Keeping only rows within
--                     `relative_margin` of the BEST hit shows the strongest
--                     cluster and adapts to each query's absolute scale.
--
-- The FTS arm is unaffected — exact terms (place/person names) still surface.
--
-- Drops every prior signature so re-running is clean (the original 5-arg 0004
-- version and the earlier 6-arg threshold version).

DROP FUNCTION IF EXISTS public.search_embeddings(TEXT, VECTOR(1536), INT, TEXT[], INT);
DROP FUNCTION IF EXISTS public.search_embeddings(TEXT, VECTOR(1536), INT, TEXT[], INT, DOUBLE PRECISION);

CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_text          TEXT,
  query_embedding     VECTOR(1536),
  match_count         INT DEFAULT 20,
  filter_source_types TEXT[] DEFAULT NULL,
  rrf_k               INT DEFAULT 60,
  min_similarity      DOUBLE PRECISION DEFAULT 0.32,
  relative_margin     DOUBLE PRECISION DEFAULT 0.12
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
  WITH scored AS (
    SELECT e.source_type, e.source_id, e.chunk_index, e.content,
           (1 - (e.embedding <=> query_embedding)) AS sim
    FROM public.embeddings e
    WHERE e.embedding IS NOT NULL
      AND (filter_source_types IS NULL OR e.source_type = ANY (filter_source_types))
  ),
  vec AS (
    SELECT source_type, source_id, chunk_index, content,
           ROW_NUMBER() OVER (ORDER BY sim DESC) AS rank
    FROM scored
    WHERE sim >= min_similarity
      AND sim >= (SELECT MAX(sim) FROM scored) - relative_margin
    ORDER BY sim DESC
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
