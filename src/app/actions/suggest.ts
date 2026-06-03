"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { embedText, hasOpenAIKey, toVectorLiteral } from "@/lib/embeddings";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import type { CareFriction, CareQuality, WorkPackage } from "@/lib/types";

const DAILY_LIMIT = 20;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 300; // categories-only output is small (no related list anymore)

// Related-items kNN tuning. The floor mirrors search's `min_similarity` (0.32):
// it separates on-topic (~0.34–0.54) from off-topic (~0.18–0.26). See ADR 0001.
const RELATED_MIN_SIMILARITY = 0.32;
const RELATED_CANDIDATES = 15; // how many neighbours to pull before floor + dedupe
const RELATED_MAX = 5; // chips shown to the researcher

const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];
const WP_KEYS: WorkPackage[] = ["WP1", "WP2", "WP3", "WP4"];

export type SuggestionRelated = {
  id: string;
  type: "note" | "insight";
  title: string;
};

export type SuggestionResult = {
  frictions: CareFriction[];
  qualities: CareQuality[];
  work_package: WorkPackage | null;
  related: SuggestionRelated[];
};

export type SuggestionAvailability =
  | { status: "ready"; remaining: number }
  | { status: "limit_reached" }
  | { status: "unavailable" } // API key missing or not signed in
  | { status: "unauthenticated" };

const EMPTY_RESULT: SuggestionResult = {
  frictions: [],
  qualities: [],
  work_package: null,
  related: [],
};

type Categories = Pick<SuggestionResult, "frictions" | "qualities" | "work_package">;
const EMPTY_CATEGORIES: Categories = { frictions: [], qualities: [], work_package: null };

function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function readUsage(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("suggestion_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("date", new Date().toISOString().slice(0, 10))
    .maybeSingle();
  if (error || !data) return 0;
  return (data as { count: number }).count;
}

export async function getSuggestionAvailability(): Promise<SuggestionAvailability> {
  if (!hasApiKey()) return { status: "unavailable" };
  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) return { status: "unauthenticated" };
  const used = await readUsage(userId);
  const remaining = Math.max(0, DAILY_LIMIT - used);
  if (remaining === 0) return { status: "limit_reached" };
  return { status: "ready", remaining };
}

export type SuggestInput = {
  noteHeadline: string;
  noteBody: string;
  currentFrictions: CareFriction[];
  currentQualities: CareQuality[];
  noteId?: string; // present when editing — excluded from its own related results
};

export type SuggestResponse =
  | { status: "ok"; suggestions: SuggestionResult; remaining: number }
  | { status: "limit_reached" }
  | { status: "unavailable" }
  | { status: "unauthenticated" }
  | { status: "error"; suggestions: SuggestionResult };

export async function requestSuggestions(input: SuggestInput): Promise<SuggestResponse> {
  if (!hasApiKey()) return { status: "unavailable" };

  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) return { status: "unauthenticated" };

  // Check rate limit before calling Claude.
  const used = await readUsage(userId);
  if (used >= DAILY_LIMIT) return { status: "limit_reached" };

  // Categorisation (Claude) and related items (vector kNN) are independent
  // paths backed by different providers — run them together and let either
  // degrade on its own (ADR 0001). `categories === null` means Claude failed.
  const [categories, related] = await Promise.all([
    suggestCategories(input),
    relatedByKnn(supabase, input),
  ]);

  if (categories === null) {
    // Claude failed. Surface related anyway (it's free of the Claude budget),
    // but only treat it as an error — and skip the counter — when nothing came
    // back at all. Either way we never charged a Claude unit, so don't bump.
    if (related.length === 0) return { status: "error", suggestions: EMPTY_RESULT };
    return {
      status: "ok",
      suggestions: { ...EMPTY_CATEGORIES, related },
      remaining: Math.max(0, DAILY_LIMIT - used),
    };
  }

  const suggestions: SuggestionResult = { ...categories, related };

  // Bump the counter only after a successful Claude response.
  let remaining = Math.max(0, DAILY_LIMIT - used - 1);
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "increment_suggestion_usage",
      { p_user_id: userId },
    );
    if (!rpcErr && typeof rpcData === "number") {
      remaining = Math.max(0, DAILY_LIMIT - rpcData);
    }
  } catch (err) {
    console.warn("[suggest] increment usage failed:", err);
  }

  return { status: "ok", suggestions, remaining };
}

// ─── Related items: vector kNN over the corpus ──────────────────
//
// Embeds the live draft text and asks `match_embeddings` for the nearest
// notes/insights. This replaces the old "dump 200 rows into Claude" approach:
// it's cheaper, scales with the corpus, and ranks by actual semantic distance.

type KnnRow = {
  source_type: string;
  source_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
};

async function relatedByKnn(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: SuggestInput,
): Promise<SuggestionRelated[]> {
  if (!hasOpenAIKey()) return [];
  const text = [input.noteHeadline, input.noteBody]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join("\n\n");
  if (!text) return [];

  try {
    const vector = await embedText(text);
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: toVectorLiteral(vector),
      match_count: RELATED_CANDIDATES,
      filter_source_types: ["quick_note", "insight"],
      exclude_source_id: input.noteId ?? null,
    });
    if (error) throw new Error(error.message);

    // Apply the similarity floor and collapse multiple chunks of the same
    // source down to its best-scoring hit (v1 is single-chunk, but PDF
    // chunking — slice E — will produce chunk_index > 0).
    const bestBySource = new Map<string, KnnRow>();
    for (const r of (data ?? []) as KnnRow[]) {
      if (r.similarity < RELATED_MIN_SIMILARITY) continue;
      const existing = bestBySource.get(r.source_id);
      if (!existing || r.similarity > existing.similarity) {
        bestBySource.set(r.source_id, r);
      }
    }
    const top = [...bestBySource.values()]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, RELATED_MAX);

    return hydrateRelated(supabase, top);
  } catch (err) {
    console.warn("[suggest] related kNN failed:", err);
    return [];
  }
}

// Resolve display titles for the kNN hits by batch-fetching the source rows.
async function hydrateRelated(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: KnnRow[],
): Promise<SuggestionRelated[]> {
  const noteIds = rows.filter((r) => r.source_type === "quick_note").map((r) => r.source_id);
  const insightIds = rows.filter((r) => r.source_type === "insight").map((r) => r.source_id);

  // key: "source_type:id" -> title
  const titles = new Map<string, string>();

  await Promise.all([
    noteIds.length
      ? supabase
          .from("quick_notes")
          .select("id, headline, body")
          .in("id", noteIds)
          .then(({ data }) => {
            for (const r of (data ?? []) as { id: string; headline: string | null; body: string }[]) {
              titles.set(
                `quick_note:${r.id}`,
                r.headline?.trim() || r.body.slice(0, 60) || "(uten tittel)",
              );
            }
          })
      : null,
    insightIds.length
      ? supabase
          .from("insights")
          .select("id, title")
          .in("id", insightIds)
          .then(({ data }) => {
            for (const r of (data ?? []) as { id: string; title: string }[]) {
              titles.set(`insight:${r.id}`, r.title);
            }
          })
      : null,
  ]);

  return rows
    .map((r): SuggestionRelated | null => {
      const title = titles.get(`${r.source_type}:${r.source_id}`);
      if (!title) return null; // source deleted but embedding not yet pruned
      return {
        id: r.source_id,
        type: r.source_type === "quick_note" ? "note" : "insight",
        title,
      };
    })
    .filter((x): x is SuggestionRelated => x !== null);
}

// ─── Categories: Claude over the note text + the taxonomy ───────
//
// Returns null on failure so the caller can keep the related items and avoid
// charging a Claude unit.

async function suggestCategories(input: SuggestInput): Promise<Categories | null> {
  const system =
    "You are a research assistant for the SAFE@HOME project, a Norwegian research project studying how municipal homecare services can be adapted for aging immigrants. You help researchers tag their field notes with the correct analytical categories.\n\nRespond only with valid JSON. No explanation, no markdown, no preamble.";

  const userPrompt = buildUserPrompt({
    headline: input.noteHeadline,
    body: input.noteBody,
    currentFrictions: input.currentFrictions,
    currentQualities: input.currentQualities,
  });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return parseCategories(text);
  } catch (err) {
    console.warn("[suggest] Claude call failed:", err);
    return null;
  }
}

// ─── Prompt building + parsing ──────────────────────────────────

function buildUserPrompt(args: {
  headline: string;
  body: string;
  currentFrictions: CareFriction[];
  currentQualities: CareQuality[];
}): string {
  const headline = args.headline.trim() || "(none)";

  return `A researcher has written the following note:

HEADLINE: ${headline}
BODY: ${args.body}

Available care frictions (systemic failure mechanisms):
- rotate: staff turnover breaks relational continuity
- script: technologies embed assumptions that don't fit diverse households
- isolate: care plans sever people from family and community networks
- reduce: complex identities flattened into bureaucratic categories
- exclude: language/digital/administrative barriers prevent service access
- invisible: care work the system doesn't see (family, transnational)
- displace: interventions that make people feel less at home

Available care qualities (how people actually live):
- transnational_flow: care/money/support circulating across borders
- household_choreography: orchestration of multi-use spaces and roles
- invisible_labor: unpaid care by relatives and community
- cultural_anchoring: food, prayer, language, ritual sustaining identity
- adaptive_resistance: quietly stopping or modifying services that don't fit
- intergenerational_exchange: bidirectional care between old and young
- digital_bridging: technology maintaining connections across distance
- belonging_negotiation: tension between 'here' and 'there'

Work packages:
- WP1: inside the home, material spaces, objects
- WP2: neighborhood, service access, care institutions
- WP3: transnational context, policy, city-level
- WP4: innovation, design, cross-cutting

Already selected frictions (do not suggest these): ${args.currentFrictions.join(", ") || "none"}
Already selected qualities (do not suggest these): ${args.currentQualities.join(", ") || "none"}

Respond with JSON in exactly this format:
{
  "frictions": ["rotate", "script"],
  "qualities": ["cultural_anchoring"],
  "work_package": "WP1"
}

Only suggest categories you are confident about. Fewer confident suggestions are better than many uncertain ones. Return empty arrays if unsure.`;
}

function parseCategories(text: string): Categories {
  // Extract JSON, even if the model wrapped it in code fences or stray prose.
  const jsonText = extractJsonObject(text);
  if (!jsonText) return EMPTY_CATEGORIES;

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return EMPTY_CATEGORIES;
  }
  if (!raw || typeof raw !== "object") return EMPTY_CATEGORIES;
  const obj = raw as Record<string, unknown>;

  const frictions = Array.isArray(obj.frictions)
    ? (obj.frictions
        .filter((v) => typeof v === "string" && (FRICTION_KEYS as string[]).includes(v))
        .slice(0, 3) as CareFriction[])
    : [];

  const qualities = Array.isArray(obj.qualities)
    ? (obj.qualities
        .filter((v) => typeof v === "string" && (QUALITY_KEYS as string[]).includes(v))
        .slice(0, 3) as CareQuality[])
    : [];

  const work_package =
    typeof obj.work_package === "string" && (WP_KEYS as string[]).includes(obj.work_package)
      ? (obj.work_package as WorkPackage)
      : null;

  return { frictions, qualities, work_package };
}

function extractJsonObject(text: string): string | null {
  // Strip ```json fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  // Find the first '{' and the matching closing '}'.
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}
