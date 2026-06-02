# ADR 0001 — Semantic search & AI assist over the research corpus

- **Status:** Accepted (v1 in progress)
- **Date:** 2026-06-02
- **Branch:** `feature/semantic-search`

## Context

The platform holds a growing corpus of Norwegian/English research material:
`insights` and `quick_notes` (raw, internal, never-published field material),
`public_stories` (curated public stories), and `public_resources` (publication
metadata). Search today is trivial — `/index` filters story *titles* by
substring; `/explore` and `/reading-room` filter by tag pills. There is no
full-text or semantic search.

An existing AI feature (`src/app/actions/suggest.ts`) already uses **Anthropic
Claude Haiku** to suggest frictions/qualities/work-package and related
notes/insights for a quick note. It works by dumping up to **200** rows as plain
text into the prompt — a hard ceiling that breaks as the corpus grows.

The original proposal was to adopt **Google Gemini File Search** (a managed RAG
store) for semantic search. This ADR records why we did *not*, and what we built
instead.

## Decision

### Retrieval lives in Supabase (pgvector), not a managed third-party index

We store embeddings in our existing Postgres via **pgvector**, rather than
uploading the corpus to Gemini File Search.

Reasons that drove the decision:

- **Governance.** The internal corpus is raw field material about vulnerable
  aging immigrants — special-category personal data under GDPR, gathered under
  research consent. Hosting it as a persistent searchable index on a third party
  is a data-transfer/consent exposure we avoid. Keeping it in the Supabase
  project already cleared for this data sidesteps that entirely.
  - Note: transient *API calls* to embed/generate text (OpenAI, Anthropic) are
    already within our accepted posture — `suggest.ts` already ships raw note
    text to Anthropic on every call. The line we don't cross is the *persistent
    hosted index*, not transient calls.
- **No sync pipeline.** Embeddings are rows keyed to the source; there is no
  second copy to keep in sync. Unpublish/delete is governed by the source row
  and RLS, so the index can't drift or leak.
- **Access control for free.** Retrieval runs through Postgres RPCs under RLS —
  an unauthorised caller physically cannot read what they shouldn't. No
  hand-rolled metadata-based access control in a second system.
- **One vendor fewer.** No new billing relationship, API key, or failure mode
  for the *store*. Synthesis stays on Claude (already wired).

The one tradeoff accepted: we own ~100 lines of retrieval code (chunking
decision, SQL functions, citation = which rows we retrieved) that File Search
would have managed. At our corpus size this is cheap and fully debuggable.

### Embeddings: OpenAI `text-embedding-3-large` @ 1536 dims

Mixed Norwegian/English, short-to-medium text. `text-embedding-3-large` is the
pragmatic default — strong multilingual quality, cheap, well-documented. We
request `dimensions: 1536` (OpenAI native truncation) so the vector fits
pgvector's 2000-dim index ceiling with negligible quality loss. The model name
is stored on every row so we can re-embed if we ever swap providers.

### Synthesis stays on Claude

The existing Anthropic integration remains the LLM for rationale and (later)
cross-corpus synthesis. We do not introduce a second LLM vendor.

### One generic `embeddings` table

`(id, source_type, source_id, chunk_index, content, content_hash, embedding
vector(1536), model, created_at, updated_at)`. A **content snapshot** is stored
so the hybrid query does vector similarity *and* Postgres full-text search in one
table, gives snippet text without a second fetch, and is already the right shape
for PDF chunks in slice 2.

## v1 scope (A + B + C + D)

- **A — Foundation.** `embeddings` table; **inline embed** in the save path
  (client saves row → calls the `embedSource` server action, which holds the
  OpenAI key and re-reads the row under the user's session). On failure the row
  is saved with a null embedding and a **batched backfill script + admin
  "missing embeddings" panel** repairs it.
- **B — Search.** Dedicated **`/internal/search`** page behind the existing
  auth-only gate. **Hybrid** = pgvector + Postgres `norwegian` FTS merged by
  reciprocal-rank fusion. Cross-lingual (Norwegian query → English row) for free.
- **C — Connection autosuggest.** Vector kNN retrieves top ~15 candidates →
  Claude filters to 3–5 with a one-line rationale, referencing only retrieved
  IDs. Replaces the 200-row ceiling in `suggest.ts`.
- **D — Category autosuggest.** Existing Claude call, grounded with kNN of
  already-tagged neighbours instead of static rules.

**Corpus indexed in v1:** `insight`, `quick_note`, `story`, `resource`
(metadata). Excluded: `design_responses`, `welfare_technologies`, `wp_reports`.

## Deferred

- **E** — PDF upload → extract (born-digital only, no OCR) → chunk → embed for
  resource full-text. Slice 2.
- **F** — Cross-corpus synthesis ("recurring tensions across WP2"). Slice 3.
- **G** — Public natural-language map filter, semantic related-stories (replaces
  the ranking inside `ConnectedStories.tsx`), policy-brief generator. Slice 4.

## Open risks (resolve before the relevant slice — not in v1)

1. **Role isolation.** Access today is auth-only; RLS lets *any* authenticated
   user read all internal notes (the `profiles.role` field is enforced nowhere).
   Search inherits this and exposes nothing new. Real role isolation is a
   separate, larger RLS project — not something a search-only gate can deliver.
2. **Hallucination guard (C/D).** Claude output must reference only retrieved
   IDs — reuse the drop-hallucinated-IDs pattern at `suggest.ts` (`parseSuggestion`).
3. **Copyright (E).** Storing third-party paper chunk-text for citation snippets
   reproduces copyrighted text — resolve licensing before ingesting non-own papers.
4. **Rate limits.** Query embedding is ~free; the Claude-rationale call in C/D
   shares the existing `suggestion_usage` daily cap.

## Consequences

- New env var: `OPENAI_API_KEY` (server-only; also set in Netlify). When unset,
  embedding is skipped and search degrades to keyword-only — no client-visible
  failure, matching how `ANTHROPIC_API_KEY` gates the suggest button.
- New one-time migration must be applied to Supabase before the features work.
- Backfill script needs `SUPABASE_SERVICE_ROLE_KEY` (local/ops only, never shipped
  to the client).
