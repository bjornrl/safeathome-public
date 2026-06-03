# Semantic search — working recap (resume here)

**Branch:** `feature/semantic-search` · **Last worked:** 2026-06-02
**Design rationale:** see `docs/adr/0001-semantic-search.md`

## Where we are — v1 slice A+B is LIVE and working

End-to-end semantic search over the internal research corpus is deployed and
proven: page → server action → OpenAI embedding → Supabase pgvector RPC →
ranked, hydrated results at **`/internal/search`** (authenticated).

### Done
- ✅ `embeddings` table + hybrid (`search_embeddings`) and kNN (`match_embeddings`)
  RPCs — migrations `0004` + `0005` **applied to Supabase**.
- ✅ OpenAI `text-embedding-3-large` @ 1536 dims; keys set in `.env.local` + Netlify.
- ✅ Backfill run: **14 quick-notes embedded** (the only rows that exist in the
  live DB — see "Data reality" below).
- ✅ Inline embed-on-save hooks (stories, resources, quick-notes) + delete cleanup.
- ✅ Admin **"Search index"** tab (missing-count panel + re-embed button).
- ✅ Search degrades to keyword-only if OpenAI fails (no client-visible error).
- ✅ Relevance tuning: absolute floor + relative band (see "Tuning" below).
- ✅ **C/D — autosuggest related items now use `match_embeddings` kNN** instead
  of dumping 200 rows into Claude. Claude's call shrank to categories-only;
  related is pure vector kNN (floor **0.32**, dedupe-by-source, top 5). The two
  paths are decoupled — different providers, each degrades on its own. `noteId`
  is threaded from the form so a note never relates to itself. See
  `src/app/actions/suggest.ts`.

### Current behaviour (measured today)
- `pizza med ananas` (off-topic) → **0 hits** ✓
- `isolasjon og digitalt utenforskap i Alna` → **11 hits** (tight, on-topic corpus
  — acceptable for now; can tighten later).
- `Alna` → 0 hits (no note contains the literal token; keyword arm found nothing).

## Tuning knobs (in `search_embeddings`, migration 0005)
- `min_similarity` (default **0.32**) — absolute floor; separates on-topic
  (~0.34–0.54) from off-topic (~0.18–0.26).
- `relative_margin` (default **0.12**) — keep only hits within this of the best
  match. Lower → fewer/tighter results; higher → more.
- To change: edit the defaults in `0005`, re-run it in the Supabase SQL editor
  (the `DROP`s at the top make re-running safe). No code/backfill change needed.
- "11 hits for isolasjon" → if we want fewer tomorrow, tighten `relative_margin`
  to ~0.08–0.09.

## Data reality (important)
The live DB has **14 quick-notes and 0 insights / 0 stories / 0 resources**. The
public site shows *seed fallback* content that isn't in the database, so it isn't
searchable. Real stories/resources become searchable automatically (inline hook)
once created through admin — or run the backfill again:
```
node --env-file=.env.local scripts/backfill-embeddings.mjs
```

## Schema note found along the way
`public_resources` has **no `authors`/`year` column** despite the TS type listing
them — the type and DB diverge. Resource embedding uses `title` + `description`
only. (Worth reconciling the `PublicResource` type vs. the real table someday.)

## Next steps
1. ✅ **C/D — autosuggest upgrade** — done (pure-kNN related, see "Done" above).
   We chose pure kNN over "kNN→Claude rationale": the UI has no rationale slot,
   and cosine over good candidates is cheaper/deterministic. If we ever want LLM
   re-ranking, feed the ~15 kNN candidates to Claude in `suggestCategories`.
2. **E** — PDF full-text ingestion for resources (storage bucket → extract →
   chunk → embed). Born-digital only, no OCR. Deferred.
3. **F/G** — cross-corpus synthesis; public features (NL map filter, semantic
   related-stories, policy-brief). Deferred.
4. Possibly tune `relative_margin` down if 11 hits feels like too many.

## Ops reminders
- `OPENAI_API_KEY` → local + Netlify (done). `SUPABASE_SERVICE_ROLE_KEY` →
  **local/ops only**, never client/Netlify build.
- New OpenAI accounts need prepaid credit before any call works (we hit a 429).
- Migrations are applied **by hand via the Supabase SQL editor** (project not
  CLI-linked), so don't `supabase db push`.
