"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { clay, space, typography } from "@/lib/design-tokens";
import { Button } from "@/components/ui";
import ContactForm from "@/components/ContactForm";
import InsightCard from "@/components/content/InsightCard";
import { loadCorpus, type CorpusNode } from "@/lib/corpus";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries/no";

/**
 * Den interne landingssida.
 *
 * Innlogging droppet folk rett inn i /admin — 2 300 linjer redigeringsverktøy
 * for innhold som ikke fantes ennå, uten et ord om hva stedet er. Det er det
 * dokumenterte punktet der folk ga opp (strategidokumentet U1). Her svares det
 * på «hva er dette, hva gjør jeg her» før noe av det tilbys.
 *
 * Layouten følger Figma-utkastet: sentrert hero, så et kontaktbelte med Bjørn
 * til venstre og meldingsskjemaet til høyre, og deretter innganger, siste
 * notater og status nedover sida — «all info finner du ved å scrolle» er en
 * lovnad ledeteksten gir, så det må finnes noe å scrolle til.
 */

interface RecentNote {
  id: string;
  headline: string | null;
  body: string;
  created_at: string;
  author_id: string | null;
}

type EntranceKey = keyof Dictionary["internal"]["entranceLabels"];

const ENTRANCES: { href: string; key: EntranceKey }[] = [
  { href: "/internal/content?tab=search", key: "search" },
  { href: "/internal/content?tab=nodes", key: "nodes" },
  { href: "/internal/content?tab=frictions", key: "frictions" },
  { href: "/internal/content?tab=qualities", key: "qualities" },
  { href: "/internal/threads", key: "threads" },
  { href: "/admin", key: "admin" },
];

const PHONE = "+47 954 63 335";
const PHONE_HREF = "tel:+4795463335";

/** 3×2 on first paint — "Last inn flere" reveals the next row of six. */
const INSIGHTS_PAGE_SIZE = 6;

/** Ankeret ledeteksten peker på. */
const ENTRANCES_ID = "innganger";
const ENTRANCES_HEADING_ID = "ih-entrances-heading";

/**
 * Ledeteksten ruller mykt ned til inngangene.
 *
 * Gjort i JS framfor `html { scroll-behavior: smooth }`: den regelen sitter på
 * rot-elementet og ville gjaldt hele appen så lenge denne sida er montert.
 * Her flyttes også fokus til seksjonen — nettleseren gjør det gratis ved et
 * vanlig ankerhopp, men ikke når vi tar over rullingen selv, og uten det blir
 * neste tabulator stående igjen oppe i hero-en.
 */
function scrollToEntrances(e: React.MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById(ENTRANCES_ID);
  if (!target) return; // La nettleseren håndtere lenka som vanlig.

  e.preventDefault();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  // Fokus på overskrifta og ikke på seksjonen: fokusringen i globals.css har
  // outline-offset, og rundt et fullbreddebelte ville den stukket utenfor
  // viewporten og gitt vannrett rulling.
  document.getElementById(ENTRANCES_HEADING_ID)?.focus({ preventScroll: true });
  // Uten dette forsvinner #innganger fra adressefeltet når vi tar preventDefault.
  history.replaceState(null, "", `#${ENTRANCES_ID}`);
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

export default function InternalHome() {
  const { t, href, intlLocale } = useI18n();
  const [notes, setNotes] = useState<RecentNote[] | null>(null);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<{ notes: number; insights: number; resources: number } | null>(null);
  const [corpusNodes, setCorpusNodes] = useState<CorpusNode[] | null>(null);
  const [visibleInsights, setVisibleInsights] = useState(INSIGHTS_PAGE_SIZE);

  useEffect(() => {
    let active = true;
    loadCorpus()
      .then((c) => {
        if (!active) return;
        const sorted = [...c.nodes].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        setCorpusNodes(sorted);
      })
      .catch(() => active && setCorpusNodes([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [recentRes, noteCount, insightCount, resourceCount] = await Promise.all([
        supabase
          .from("quick_notes")
          .select("id, headline, body, created_at, author_id")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("quick_notes").select("id", { count: "exact", head: true }),
        supabase.from("insights").select("id", { count: "exact", head: true }),
        supabase.from("public_resources").select("id", { count: "exact", head: true }),
      ]);
      if (!active) return;

      const rows = (recentRes.data ?? []) as RecentNote[];
      setNotes(rows);
      setCounts({
        notes: noteCount.count ?? 0,
        insights: insightCount.count ?? 0,
        resources: resourceCount.count ?? 0,
      });

      const ids = [...new Set(rows.map((n) => n.author_id).filter((v): v is string => Boolean(v)))];
      if (ids.length > 0) {
        const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        if (!active) return;
        const map: Record<string, string> = {};
        for (const p of (data ?? []) as { id: string; full_name: string }[]) map[p.id] = p.full_name;
        setAuthors(map);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main
      id="main-content"
      style={{
        fontFamily: clay.font.body,
        background: clay.colors.canvas,
        color: clay.colors.body,
      }}
    >
      <style>{CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ ...page, padding: "clamp(48px, 9vh, 88px) 24px clamp(40px, 7vh, 72px)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <p
            className="ih-rise"
            style={{
              ...typography.sizes.t20,
              color: clay.colors.muted,
              margin: `0 0 ${space.s8}`,
              animationDelay: "0.02s",
            }}
          >
            {t.internal.welcomeTo}
          </p>
          {/* Bevisst uten størrelsesoverstyring: h1 i globals.css er allerede
              72/-2.5px på desktop, samme som forsida. Hero-en skal kjennes
              igjen som samme produkt. */}
          <h1 className="ih-rise" style={{ animationDelay: "0.08s" }}>
            {t.internal.heading}
          </h1>
          <p
            className="ih-rise"
            style={{
              ...typography.sizes.t18,
              lineHeight: 1.6,
              color: clay.colors.body,
              maxWidth: "56ch",
              margin: `${space.s24} auto 0`,
              animationDelay: "0.14s",
            }}
          >
            {t.internal.lead}
          </p>
          <div className="ih-rise" style={{ marginTop: space.s32, animationDelay: "0.2s" }}>
            <a className="ih-cue" href={`#${ENTRANCES_ID}`} onClick={scrollToEntrances}>
              {t.internal.scrollCue}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Kontaktbelte ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="ih-contact-heading"
        style={{ ...page, maxWidth: "928px", paddingBottom: space.s96 }}
      >
        <div className="ih-contact">
          <div>
            {/* <h2 id="ih-contact-heading" style={eyebrow}>
              {t.internal.contactEyebrow}
            </h2> */}
            <div style={{ display: "flex", gap: space.s16, alignItems: "center", marginBottom: space.s16 }}>
              <ProfilePhoto src="/images/bjorn.jpg" name="Bjørn Ravlo-Leira" size={48} />
              <span
                style={{
                  ...typography.sizes.t16,
                  fontWeight: 600,
                  color: clay.colors.ink,
                  letterSpacing: "-0.2px",
                }}
              >
                Bjørn Ravlo-Leira
              </span>
            </div>
            <p style={{ ...typography.sizes.t16, lineHeight: 1.6, color: clay.colors.body, margin: 0 }}>
              {t.internal.contactLead}
            </p>
            <p style={{ margin: `${space.s24} 0 0` }}>
              <span style={{ ...typography.sizes.t14, color: clay.colors.muted }}>
                {t.internal.contactPhoneLabel}{" "}
              </span>
              <a className="ih-phone" href={PHONE_HREF}>
                {PHONE}
              </a>
            </p>
          </div>

          <div>
            {/* <h2 style={eyebrow}>{t.internal.formEyebrow}</h2> */}
            <div className="ih-form">
              <ContactForm compact />
            </div>
          </div>
        </div>
      </section>

      {/* ── Innsikter ────────────────────────────────────────────────── */}
      <section aria-labelledby="ih-insights-heading" style={{ ...page, paddingBottom: space.s64 }}>
        <h2 id="ih-insights-heading" style={eyebrow}>
          {t.internal.insightsHeading}
        </h2>
        <p style={{ ...typography.sizes.t16, color: clay.colors.body, maxWidth: "56ch", margin: `0 0 ${space.s32}` }}>
          {t.internal.insightsLead}
        </p>
        {corpusNodes === null ? (
          <p style={muted}>{t.common.loading}</p>
        ) : corpusNodes.length === 0 ? (
          <p style={muted}>{t.internal.noInsights}</p>
        ) : (
          <>
            <div className="ih-insight-grid">
              {corpusNodes.slice(0, visibleInsights).map((n, i) => (
                <InsightCard key={n.id} node={n} colorIndex={i} href={href("/internal/content?tab=search")} />
              ))}
            </div>
            {visibleInsights < corpusNodes.length && (
              <div style={{ textAlign: "center", marginTop: space.s32 }}>
                <Button variant="secondary" onClick={() => setVisibleInsights((v) => v + INSIGHTS_PAGE_SIZE)}>
                  {t.internal.loadMoreInsights}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <div style={{ ...page, padding: `${space.s64} ${space.s24} ${space.s96}` }}>
        <div className="ih-lower">
          <section aria-labelledby="ih-notes-heading">
            <h2 id="ih-notes-heading" style={eyebrow}>
              {t.internal.recentNotes}
            </h2>
            {notes === null ? (
              <p style={muted}>{t.common.loading}</p>
            ) : notes.length === 0 ? (
              <p style={muted}>{t.internal.noNotes}</p>
            ) : (
              <ul className="ih-list">
                {notes.map((n) => (
                  <li key={n.id}>
                    <Link className="ih-note" href={href("/admin?tab=notes")}>
                      <span className="ih-note-title">
                        {n.headline?.trim() || n.body.slice(0, 60) || t.common.untitled}
                      </span>
                      <span className="ih-note-meta">
                        {(n.author_id && authors[n.author_id]) || t.common.unknown} ·{" "}
                        {formatDate(n.created_at, intlLocale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="ih-status-heading">
            <h2 id="ih-status-heading" style={eyebrow}>
              {t.internal.status}
            </h2>
            {counts === null ? (
              <p style={muted}>{t.common.loading}</p>
            ) : (
              <ul className="ih-list">
                <StatRow label={t.internal.statNotes} value={counts.notes} />
                <StatRow label={t.internal.statInsights} value={counts.insights} />
                <StatRow label={t.internal.statResources} value={counts.resources} />
              </ul>
            )}
            <p style={{ ...typography.sizes.t14, color: clay.colors.muted, marginTop: space.s24 }}>
              {t.internal.statFootnote}
            </p>
          </section>
        </div>
      </div>

      {/* ── Innganger ────────────────────────────────────────────────── */}
      <section
        id={ENTRANCES_ID}
        aria-labelledby={ENTRANCES_HEADING_ID}
        style={{
          background: clay.colors.surfaceSoft,
          borderTop: `1px solid ${clay.colors.hairline}`,
          // Navlinja er klistret; uten dette havner overskrifta under den når
          // ledeteksten hopper hit.
          scrollMarginTop: "80px",
        }}
      >
        <div style={{ ...page, padding: `${space.s64} ${space.s24}` }}>
          <h2 id={ENTRANCES_HEADING_ID} tabIndex={-1} style={eyebrow}>
            {t.internal.entrances}
          </h2>
          <div className="ih-doors">
            {ENTRANCES.map((e) => (
              <Link key={e.href} className="ih-door" href={href(e.href)}>
                <span>
                  <span className="ih-door-title">{t.internal.entranceLabels[e.key]}</span>
                  <span className="ih-door-blurb">{t.internal.entranceBlurbs[e.key]}</span>
                </span>
                <span className="ih-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Siste notater + status ───────────────────────────────────── */}

    </main>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="ih-stat">
      <span style={{ ...typography.sizes.t14, color: clay.colors.muted }}>{label}</span>
      <span
        style={{
          fontFamily: clay.font.display,
          fontSize: "28px",
          lineHeight: 1,
          fontWeight: 500,
          letterSpacing: "-1px",
          color: clay.colors.ink,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </li>
  );
}

const page: React.CSSProperties = {
  maxWidth: "1040px",
  margin: "0 auto",
  padding: `0 ${space.s24}`,
};

/** Samme seksjonsetikett over hele sida — det er den som gir rytmen. */
const eyebrow: React.CSSProperties = {
  fontFamily: clay.font.body,
  fontSize: "12px",
  lineHeight: "20px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  color: clay.colors.muted,
  margin: `0 0 ${space.s16}`,
};

const muted: React.CSSProperties = {
  ...typography.sizes.t14,
  color: clay.colors.muted,
};

function ProfilePhoto({ src, name, size }: { src: string; name: string; size: number }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (errored) {
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          background: clay.colors.teal,
          color: clay.colors.onPrimary,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size / 2.6),
          fontWeight: 600,
        }}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: `1px solid ${clay.colors.hairline}`,
      }}
    />
  );
}

/**
 * Hover-, fokus- og media-tilstander lar seg ikke uttrykke som inline style,
 * og resten av kodebasen løser det på samme måte (se forsida). Alt er prefikset
 * `ih-` slik at det ikke lekker ut av denne sida.
 */
const CSS = `
@keyframes ih-rise {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
.ih-rise { animation: ih-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards; }

.ih-cue {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--clay-hairline);
  border-radius: var(--clay-radius-pill);
  font-size: 14px;
  line-height: 1;
  color: var(--clay-muted);
  text-decoration: none;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.ih-cue:hover, .ih-cue:focus-visible {
  color: var(--clay-ink);
  border-color: var(--clay-ink);
  background: var(--clay-surface-soft);
}
.ih-cue span { transition: transform 0.18s ease; }
.ih-cue:hover span { transform: translateY(3px); }

.ih-contact {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  align-items: start;
}
@media (min-width: 860px) {
  .ih-contact { grid-template-columns: 1fr 1fr; gap: 48px; }
}

.ih-phone {
  font-size: 16px;
  font-weight: 600;
  color: var(--clay-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--clay-hairline);
  padding-bottom: 1px;
  white-space: nowrap;
  transition: border-color 0.18s ease;
}
.ih-phone:hover, .ih-phone:focus-visible { border-color: var(--clay-ink); }

/* Skjemafeltene arver den firkantede standardstilen fra ui/Field. Inne i
   kortet skal de være myke, slik utkastet viser — avgrenset til denne sida. */
.ih-form {
  /* surface-card og ikke -soft: kvitteringen ContactForm viser etter sending
     står på surface-soft, og ville forsvunnet i kortet den ligger i. */
  background: var(--clay-surface-card);
  border: 1px solid var(--clay-hairline);
  border-radius: var(--clay-radius-lg);
  padding: 20px;
}
.ih-form input,
.ih-form textarea {
  background: var(--clay-canvas);
  border-radius: var(--clay-radius-sm);
  border-color: var(--clay-hairline);
}
.ih-form input:focus,
.ih-form textarea:focus { border-color: var(--clay-ink); }

.ih-doors {
  display: grid;
  grid-template-columns: 1fr;
  border-bottom: 1px solid var(--clay-hairline);
}
@media (min-width: 720px) {
  .ih-doors { grid-template-columns: 1fr 1fr; column-gap: 48px; }
}
/* Radene ligger flush med seksjonsetiketten, så hårstrekene står i samme
   venstremarg som resten av sida. Hover-flata får luft rundt seg via en
   box-shadow i stedet for negativ margin, som ellers ville dratt strekene
   16 px utenfor spalta. */
.ih-door {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--clay-hairline);
  color: inherit;
  text-decoration: none;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.ih-door:hover, .ih-door:focus-visible {
  background: var(--clay-surface-card);
  box-shadow: -14px 0 0 var(--clay-surface-card), 14px 0 0 var(--clay-surface-card);
}
.ih-door-title {
  display: block;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--clay-ink);
}
.ih-door-blurb {
  display: block;
  margin-top: 2px;
  font-size: 14px;
  line-height: 21px;
  color: var(--clay-muted);
}
.ih-arrow { color: var(--clay-muted-soft); transition: transform 0.18s ease, color 0.18s ease; }
.ih-door:hover .ih-arrow, .ih-door:focus-visible .ih-arrow {
  transform: translateX(4px);
  color: var(--clay-ink);
}

.ih-insight-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 620px) {
  .ih-insight-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 980px) {
  .ih-insight-grid { grid-template-columns: repeat(3, 1fr); }
}

.ih-lower { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: start; }
@media (min-width: 860px) {
  .ih-lower { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 64px; }
}

.ih-list { list-style: none; margin: 0; padding: 0; border-bottom: 1px solid var(--clay-hairline); }
.ih-note {
  display: block;
  padding: 14px 0;
  border-top: 1px solid var(--clay-hairline);
  color: inherit;
  text-decoration: none;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.ih-note:hover, .ih-note:focus-visible {
  background: var(--clay-surface-soft);
  box-shadow: -14px 0 0 var(--clay-surface-soft), 14px 0 0 var(--clay-surface-soft);
}
.ih-note-title {
  display: block;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: var(--clay-ink);
}
.ih-note-meta {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  line-height: 20px;
  color: var(--clay-muted);
}

.ih-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid var(--clay-hairline);
}

@media (prefers-reduced-motion: reduce) {
  .ih-rise { animation: none; }
  .ih-cue span, .ih-arrow { transition: none; }
}
`;
