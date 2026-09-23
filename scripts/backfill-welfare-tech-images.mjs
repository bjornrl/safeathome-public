// Staging backfill of product images for public.welfare_technologies ("initiatives").
//
// For every row with image_url IS NULL: fetch the row's `url`, find the most
// prominent public product/marketing image (og:image → twitter:image →
// link[rel=image_src] → JSON-LD image → first non-logo <img>), validate it
// (jpeg/png/webp/gif, ≤ 5 MB), upload it to the public "welfare-tech-images"
// bucket under backfill/<slug>-<id8>.<ext>, and record the result in
// scripts/output/welfare-tech-image-manifest.json.
//
// This run NEVER writes welfare_technologies.image_url — applying the manifest
// is a separate, human-reviewed step.
//
// Usage (Node 20.6+):
//   node --env-file=.env.local scripts/backfill-welfare-tech-images.mjs
//   node --env-file=.env.local scripts/backfill-welfare-tech-images.mjs --only 488d1610,67c9e1c1
//   node --env-file=.env.local scripts/backfill-welfare-tech-images.mjs --override 488d1610=https://example.com/hero.jpg
//   node --env-file=.env.local scripts/backfill-welfare-tech-images.mjs --retry-failed
//
//   --only <id8,...>          process only these rows (first 8 chars of id)
//   --override <id8>=<url>    use this direct image URL for a row instead of
//                             scraping (for rows resolved via browser fallback);
//                             overridden rows are re-processed even if they
//                             already have a manifest entry
//   --retry-failed            re-process rows whose manifest status is failed
//   --dry-run                 scrape + validate, but do not upload or write
//
// Requires in env (OPS ONLY — service role bypasses RLS, never ship client-side):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const BUCKET = "welfare-tech-images";
const PREFIX = "backfill";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_FOR = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const REQUEST_TIMEOUT_MS = 15_000;
const POLITE_DELAY_MS = 1_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; SafeAtHome-ImageBackfill/1.0; +https://safeathome.no) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, "output/welfare-tech-image-manifest.json");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const ONLY = new Set((opt("--only") ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const OVERRIDES = new Map(
  args
    .flatMap((a, i) => (a === "--override" ? [args[i + 1]] : []))
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      return [pair.slice(0, eq).trim(), pair.slice(eq + 1).trim()];
    }),
);
const RETRY_FAILED = flag("--retry-failed");
const DRY_RUN = flag("--dry-run");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(title) {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/ø/gi, "o")
    .replace(/å/gi, "a")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled";
}

async function fetchWithTimeout(url, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...init,
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: init.accept ?? "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "nb-NO,nb;q=0.9,en;q=0.8",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Extract candidate image URLs from raw HTML, best-first. */
function extractCandidates(html, pageUrl) {
  const out = [];
  const push = (raw, source) => {
    if (!raw) return;
    let u = decodeEntities(raw.trim());
    if (!u || u.startsWith("data:")) return;
    try {
      u = new URL(u, pageUrl).toString();
    } catch {
      return;
    }
    if (!/^https?:/.test(u)) return;
    if (!out.some((c) => c.url === u)) out.push({ url: u, source });
  };

  // <meta property="og:image" content="..."> (attribute order varies)
  const metaRe = /<meta\b[^>]*>/gi;
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
    return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
  };
  const metas = html.match(metaRe) ?? [];
  const byKey = (key) =>
    metas
      .filter((t) => {
        const k = (attr(t, "property") ?? attr(t, "name") ?? "").toLowerCase();
        return k === key;
      })
      .map((t) => attr(t, "content"));

  for (const k of ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]) {
    for (const c of byKey(k)) push(c, `meta ${k}`);
  }

  // <link rel="image_src" href="...">
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (/\brel\s*=\s*["']?image_src/i.test(tag)) push(attr(tag, "href"), "link image_src");
  }

  // JSON-LD "image"
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (node) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) return node.forEach(walk);
        const img = node.image ?? node.thumbnailUrl;
        if (typeof img === "string") push(img, "json-ld image");
        else if (Array.isArray(img)) img.forEach((i) => push(typeof i === "string" ? i : i?.url, "json-ld image"));
        else if (img && typeof img === "object") push(img.url, "json-ld image");
        Object.values(node).forEach(walk);
      };
      walk(JSON.parse(m[1]));
    } catch {
      /* ignore malformed JSON-LD */
    }
  }

  // Fallback: <img> tags that look like content, not chrome.
  const junk = /logo|icon|sprite|favicon|badge|flag|arrow|pixel|tracking|\.svg(\?|$)|1x1|spacer|avatar|payment|social/i;
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const scored = [];
  for (const tag of imgs) {
    const src =
      attr(tag, "src") ??
      attr(tag, "data-src") ??
      attr(tag, "data-lazy-src") ??
      (attr(tag, "srcset") ?? attr(tag, "data-srcset") ?? "").split(",").pop()?.trim().split(/\s+/)[0];
    if (!src || junk.test(src) || junk.test(attr(tag, "alt") ?? "") || junk.test(attr(tag, "class") ?? "")) continue;
    const w = parseInt(attr(tag, "width") ?? "0", 10) || 0;
    const h = parseInt(attr(tag, "height") ?? "0", 10) || 0;
    if ((w && w < 200) || (h && h < 150)) continue;
    const bonus = /hero|product|banner|header|main|feature/i.test(tag) ? 1_000_000 : 0;
    scored.push({ src, score: bonus + w * h });
  }
  scored.sort((a, b) => b.score - a.score);
  for (const s of scored.slice(0, 5)) push(s.src, "img tag");

  return out;
}

function sniffMime(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/** Download + validate one candidate. Returns { buffer, contentType } or throws. */
async function downloadImage(url) {
  const res = await fetchWithTimeout(url, { accept: "image/*,*/*;q=0.8", headers: { Referer: url } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const declared = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new Error(`too large (${len} bytes)`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_BYTES) throw new Error(`too large (${buffer.length} bytes)`);
  if (buffer.length < 1024) throw new Error(`too small (${buffer.length} bytes)`);
  const sniffed = sniffMime(buffer);
  const contentType = sniffed ?? declared;
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error(`disallowed type (declared ${declared || "none"}, sniffed ${sniffed || "unknown"})`);
  }
  return { buffer, contentType };
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

async function loadManifest() {
  try {
    const parsed = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveManifest(entries) {
  await mkdir(dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(entries, null, 2) + "\n");
}

function upsertEntry(entries, entry) {
  const i = entries.findIndex((e) => e.id === entry.id);
  if (i >= 0) entries[i] = entry;
  else entries.push(entry);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const { data: rows, error: rowsErr } = await supabase
  .from("welfare_technologies")
  .select("id, title, manufacturer, url")
  .is("image_url", null)
  .order("title");
if (rowsErr) {
  console.error(`read welfare_technologies: ${rowsErr.message}`);
  process.exit(1);
}

const manifest = await loadManifest();
const counts = { total: rows.length, processed: 0, succeeded: 0, skipped: 0, failed: 0, resumed: 0 };

console.log(`${rows.length} rows with image_url IS NULL${DRY_RUN ? " (dry run)" : ""}\n`);

for (const row of rows) {
  const id8 = row.id.slice(0, 8);
  if (ONLY.size && !ONLY.has(id8)) continue;

  const existing = manifest.find((e) => e.id === row.id);
  const override = OVERRIDES.get(id8);
  if (existing?.status === "success" && !override) {
    counts.resumed += 1;
    continue;
  }
  if (existing?.status === "failed" && !override && !RETRY_FAILED) {
    counts.failed += 1;
    continue;
  }

  counts.processed += 1;
  const label = `${row.title} (${id8})`;
  const base = { id: row.id, title: row.title, manufacturer: row.manufacturer ?? null, source_url: row.url ?? null };
  const record = (entry) => {
    upsertEntry(manifest, { ...base, ...entry });
    counts[entry.status === "success" ? "succeeded" : entry.status] += 1;
  };

  if (!row.url || !row.url.trim()) {
    console.log(`skipped: no url  — ${label}`);
    record({ image_scraped_from: null, uploaded_url: null, status: "skipped", reason: "no url" });
    continue;
  }

  try {
    // 1. Build candidate list.
    let candidates;
    let scrapedPage = row.url;
    if (override) {
      candidates = [{ url: override, source: "override" }];
      scrapedPage = override;
    } else {
      const res = await fetchWithTimeout(row.url);
      if (!res.ok) throw new Error(`page HTTP ${res.status}`);
      const finalUrl = res.url || row.url;
      const html = await res.text();
      candidates = extractCandidates(html, finalUrl);
      scrapedPage = finalUrl;
      if (!candidates.length) throw new Error("no image candidates in HTML (JS-rendered? needs browser fallback)");
    }

    // 2. Try candidates best-first until one validates.
    let picked = null;
    const attempts = [];
    for (const c of candidates) {
      try {
        const img = await downloadImage(c.url);
        picked = { ...c, ...img };
        break;
      } catch (err) {
        attempts.push(`${c.source}: ${err.message}`);
        await sleep(300);
      }
    }
    if (!picked) throw new Error(`all ${candidates.length} candidates failed — ${attempts.join(" | ")}`);

    // 3. Upload.
    const ext = EXT_FOR[picked.contentType];
    const path = `${PREFIX}/${slugify(row.title)}-${id8}.${ext}`;
    let publicUrl = null;
    if (!DRY_RUN) {
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, picked.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: picked.contentType,
      });
      if (upErr) {
        // Re-running after a crash: the object may already be there.
        if (!/already exists|duplicate/i.test(upErr.message)) throw new Error(`upload: ${upErr.message}`);
      }
      publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    console.log(
      `success — ${label}\n    ${picked.source}: ${picked.url}\n    → ${publicUrl ?? "(dry run)"} [${picked.contentType}, ${(picked.buffer.length / 1024).toFixed(0)} KB]`,
    );
    record({
      image_scraped_from: override ? override : picked.url,
      scraped_page: scrapedPage,
      candidate_source: picked.source,
      uploaded_url: publicUrl,
      status: "success",
    });
  } catch (err) {
    const reason = err.name === "AbortError" ? `timeout after ${REQUEST_TIMEOUT_MS / 1000}s` : err.message;
    console.log(`failed  — ${label}\n    ${reason}`);
    record({ image_scraped_from: null, uploaded_url: null, status: "failed", reason });
  } finally {
    if (!DRY_RUN) await saveManifest(manifest);
    await sleep(POLITE_DELAY_MS);
  }
}

if (!DRY_RUN) await saveManifest(manifest);

const finalCounts = manifest.reduce(
  (acc, e) => ((acc[e.status] = (acc[e.status] ?? 0) + 1), acc),
  { success: 0, skipped: 0, failed: 0 },
);

console.log("\n──────── summary ────────");
console.log(`rows with image_url IS NULL : ${counts.total}`);
console.log(`processed this run          : ${counts.processed} (${counts.resumed} already succeeded, resumed)`);
console.log(`succeeded                   : ${finalCounts.success}`);
console.log(`skipped                     : ${finalCounts.skipped}`);
console.log(`failed                      : ${finalCounts.failed}`);
console.log(`manifest                    : ${MANIFEST_PATH}`);
if (finalCounts.failed) {
  console.log("\nfailed rows (use browser fallback + --override <id8>=<image url>):");
  for (const e of manifest.filter((e) => e.status === "failed")) {
    console.log(`  ${e.id.slice(0, 8)}  ${e.title}  ${e.source_url}\n    ${e.reason}`);
  }
}
