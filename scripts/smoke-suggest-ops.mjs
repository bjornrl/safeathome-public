// Ops smoke test for AI suggestions + semantic related items.
//
// Usage:
//   node --env-file=.env.local scripts/smoke-suggest-ops.mjs
//
// Checks env vars, DB tables/RPCs, embeddings index, and a live OpenAI→kNN round-trip.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const PASS = "✓";
const FAIL = "✗";
let failed = 0;

function ok(label, detail) {
  console.log(`${PASS} ${label}: ${detail}`);
}
function bad(label, detail) {
  console.log(`${FAIL} ${label}: ${detail}`);
  failed += 1;
}

function envKey(name) {
  const v = process.env[name]?.trim();
  return v && v.length > 3 ? v : null;
}

// ── Env ─────────────────────────────────────────────────────────
console.log("\n=== Environment ===\n");

if (!existsSync(".env.local")) bad(".env.local", "file missing");
else ok(".env.local", "present");

for (const k of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
]) {
  if (envKey(k)) ok(k, "set");
  else bad(k, "missing or empty");
}

if (envKey("ANTHROPIC_API_KEY")) ok("ANTHROPIC_API_KEY", "set (✦ Suggest button will show)");
else bad("ANTHROPIC_API_KEY", "missing — category suggestions disabled in UI");

const url = envKey("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = envKey("SUPABASE_SERVICE_ROLE_KEY");
const openaiKey = envKey("OPENAI_API_KEY");

if (!url || !serviceKey) {
  console.log("\nCannot continue DB checks without Supabase URL + service role key.\n");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// ── Tables ──────────────────────────────────────────────────────
console.log("\n=== Database ===\n");

for (const t of [
  "suggestion_usage",
  "embeddings",
  "quick_notes",
  "insights",
  "public_stories",
  "public_resources",
]) {
  const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
  if (error) bad(`table ${t}`, error.message);
  else ok(`table ${t}`, `${count ?? 0} rows`);
}

const { data: embRows, error: embErr } = await supabase
  .from("embeddings")
  .select("source_type")
  .limit(500);
if (embErr) bad("embeddings breakdown", embErr.message);
else {
  const byType = {};
  for (const r of embRows ?? []) byType[r.source_type] = (byType[r.source_type] ?? 0) + 1;
  ok("embeddings indexed", JSON.stringify(byType));
}

// ── RPCs ────────────────────────────────────────────────────────
console.log("\n=== RPCs ===\n");

const dummyVec = `[${Array(1536).fill(0).join(",")}]`;
const { error: matchErr } = await supabase.rpc("match_embeddings", {
  query_embedding: dummyVec,
  match_count: 1,
  filter_source_types: ["quick_note", "insight"],
  exclude_source_id: null,
});
if (matchErr) bad("match_embeddings", matchErr.message);
else ok("match_embeddings", "callable");

const { error: incErr } = await supabase.rpc("increment_suggestion_usage", {
  p_user_id: "00000000-0000-0000-0000-000000000000",
});
if (incErr && /Could not find the function/i.test(incErr.message)) {
  bad(
    "increment_suggestion_usage",
    "missing — run supabase/migrations/0003_suggestion_usage.sql in the SQL editor",
  );
} else if (incErr) {
  // FK / RLS errors mean the function exists.
  ok("increment_suggestion_usage", `callable (${incErr.message.slice(0, 60)}…)`);
} else {
  ok("increment_suggestion_usage", "callable");
}

// ── Live OpenAI → kNN ───────────────────────────────────────────
console.log("\n=== Live related-items path ===\n");

if (!openaiKey) {
  bad("OpenAI embed + kNN", "skipped — no OPENAI_API_KEY");
} else {
  const probe =
    "Vikarbytte og språkbarrierer i hjemmetjenesten i Alna";
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-large",
        input: probe,
        dimensions: 1536,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 120)}`);
    const vec = (await res.json()).data[0].embedding;
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: `[${vec.join(",")}]`,
      match_count: 3,
      filter_source_types: ["quick_note", "insight"],
      exclude_source_id: null,
    });
    if (error) throw new Error(error.message);
    const hits = data ?? [];
    if (hits.length === 0) bad("semantic neighbours", "0 hits — run backfill-embeddings.mjs");
    else {
      ok("semantic neighbours", `${hits.length} hits (top sim ${hits[0].similarity?.toFixed(3)})`);
      for (const h of hits.slice(0, 2)) {
        console.log(`    · ${h.source_type} ${h.similarity?.toFixed(3)} — ${(h.content ?? "").slice(0, 55)}…`);
      }
    }
  } catch (err) {
    bad("OpenAI embed + kNN", err.message);
  }
}

// ── Summary ─────────────────────────────────────────────────────
console.log("\n=== Manual UI check (after fixing blockers) ===\n");
console.log("1. npm run dev");
console.log("2. Sign in → Quick Notes → write 80+ chars");
console.log("3. Click ✦ Foreslå kategorier → ghost tags + related sidebar\n");

if (failed > 0) {
  console.log(`${FAIL} ${failed} check(s) failed.\n`);
  process.exit(1);
}
console.log(`${PASS} All automated checks passed.\n`);
