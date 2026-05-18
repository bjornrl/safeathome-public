"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import type { CareFriction, CareQuality, WorkPackage } from "@/lib/types";

const DAILY_LIMIT = 20;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 500;

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

  // Pull the existing notes + insights to give Claude something to relate against.
  const [notesRes, insightsRes] = await Promise.all([
    supabase.from("quick_notes").select("id, headline, body").limit(200),
    supabase.from("insights").select("id, title, body").limit(200),
  ]);
  type NoteRow = { id: string; headline: string | null; body: string };
  type InsightRow = { id: string; title: string; body: string };
  const notes = ((notesRes.data ?? []) as NoteRow[]).map((n) => ({
    id: n.id,
    type: "note" as const,
    title: (n.headline?.trim() || n.body.slice(0, 60)) ?? "(uten tittel)",
    excerpt: (n.body ?? "").slice(0, 200),
  }));
  const insights = ((insightsRes.data ?? []) as InsightRow[]).map((i) => ({
    id: i.id,
    type: "insight" as const,
    title: i.title,
    excerpt: (i.body ?? "").slice(0, 200),
  }));
  const corpus = [...notes, ...insights];

  // Build prompt.
  const system =
    "You are a research assistant for the SAFE@HOME project, a Norwegian research project studying how municipal homecare services can be adapted for aging immigrants. You help researchers tag their field notes with the correct analytical categories and find connections to related observations.\n\nRespond only with valid JSON. No explanation, no markdown, no preamble.";

  const userPrompt = buildUserPrompt({
    headline: input.noteHeadline,
    body: input.noteBody,
    currentFrictions: input.currentFrictions,
    currentQualities: input.currentQualities,
    corpus,
  });

  let parsed: SuggestionResult = EMPTY_RESULT;
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
    parsed = parseSuggestion(text, corpus);
  } catch (err) {
    console.warn("[suggest] Claude call failed:", err);
    return { status: "error", suggestions: EMPTY_RESULT };
  }

  // Bump the counter only after a successful API response.
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

  return { status: "ok", suggestions: parsed, remaining };
}

// ─── Prompt building + parsing ──────────────────────────────────

function buildUserPrompt(args: {
  headline: string;
  body: string;
  currentFrictions: CareFriction[];
  currentQualities: CareQuality[];
  corpus: { id: string; type: "note" | "insight"; title: string; excerpt: string }[];
}): string {
  const headline = args.headline.trim() || "(none)";
  const corpusLines = args.corpus
    .slice(0, 200)
    .map((c) => `[${c.id}] [type: ${c.type}] ${c.title}: ${c.excerpt}`)
    .join("\n");

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

Existing notes and insights (suggest up to 5 that are most related):
${corpusLines || "(none)"}

Respond with JSON in exactly this format:
{
  "frictions": ["rotate", "script"],
  "qualities": ["cultural_anchoring"],
  "work_package": "WP1",
  "related": [
    {"id": "uuid-here", "type": "note", "title": "Title here"},
    {"id": "uuid-here", "type": "insight", "title": "Title here"}
  ]
}

Only suggest categories you are confident about. Fewer confident suggestions are better than many uncertain ones. Return empty arrays if unsure.`;
}

function parseSuggestion(
  text: string,
  corpus: { id: string; type: "note" | "insight"; title: string }[],
): SuggestionResult {
  // Extract JSON, even if the model wrapped it in code fences or stray prose.
  const jsonText = extractJsonObject(text);
  if (!jsonText) return EMPTY_RESULT;

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return EMPTY_RESULT;
  }
  if (!raw || typeof raw !== "object") return EMPTY_RESULT;
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

  const corpusById = new Map(corpus.map((c) => [c.id, c]));
  const related = Array.isArray(obj.related)
    ? (obj.related
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const e = entry as Record<string, unknown>;
          const id = typeof e.id === "string" ? e.id : null;
          if (!id) return null;
          const known = corpusById.get(id);
          if (!known) return null; // Drop hallucinated IDs.
          return {
            id,
            type: known.type,
            title: typeof e.title === "string" && e.title.trim() ? e.title : known.title,
          };
        })
        .filter((x): x is SuggestionRelated => x !== null)
        .slice(0, 5))
    : [];

  return { frictions, qualities, work_package, related };
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
