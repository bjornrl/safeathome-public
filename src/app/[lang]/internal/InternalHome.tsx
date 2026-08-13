"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries/no";

/**
 * The internal landing page.
 *
 * Signing in used to drop everyone straight into /admin — 2 300 lines of
 * editing tools for content that did not exist yet, with no explanation of what
 * the place was for. That is the documented point where people gave up
 * (strategidokumentet U1). This answers "what is this, what do I do here"
 * before offering any of it.
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
      style={{ fontFamily: FONT_STACK }}
      className="[max-width:1200px] [margin:0_auto] [padding:40px_24px_96px]"
    >
      <header className="[margin-bottom:12px]">
        <h1 className="[font-size:40px] [font-weight:700] [letter-spacing:-0.02em] [color:#2a2859] [margin:0_0_12px]">
          {t.internal.heading}
        </h1>
        {/* The one global honesty line, per §6.4: mark what is finished, not
            what is in progress — in-progress is almost everything. */}
        <p style={{ ...typography.sizes.t16, color: colors.textMuted, margin: 0 }}>
          {t.internal.workInProgress}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: space.s32,
          marginTop: space.s32,
        }}
      >
        <section>
          <h2 style={sectionHeading}>{t.internal.recentNotes}</h2>
          {notes === null ? (
            <p style={muted}>{t.common.loading}</p>
          ) : notes.length === 0 ? (
            <p style={muted}>{t.internal.noNotes}</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {notes.map((n) => (
                <li
                  key={n.id}
                  style={{
                    borderBottom: `1px solid ${colors.borderSubtle}`,
                    padding: `${space.s12} 0`,
                  }}
                >
                  <Link
                    href={href("/admin?tab=notes")}
                    style={{
                      ...typography.sizes.t16,
                      color: colors.textBody,
                      textDecoration: "none",
                      fontWeight: typography.weights.medium,
                      display: "block",
                    }}
                  >
                    {n.headline?.trim() || n.body.slice(0, 60) || t.common.untitled}
                  </Link>
                  <span style={{ ...typography.sizes.t12, color: colors.textMuted }}>
                    {(n.author_id && authors[n.author_id]) || t.common.unknown} · {formatDate(n.created_at, intlLocale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 style={sectionHeading}>{t.internal.entrances}</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {ENTRANCES.map((e) => (
              <li key={e.href} style={{ marginBottom: space.s16 }}>
                <Link
                  href={href(e.href)}
                  style={{
                    ...typography.sizes.t16,
                    color: colors.brandWarmBlue,
                    fontWeight: typography.weights.medium,
                    textDecoration: "none",
                  }}
                >
                  {t.internal.entranceLabels[e.key]}
                </Link>
                <p style={{ ...typography.sizes.t14, color: colors.textMuted, margin: `2px 0 0` }}>
                  {t.internal.entranceBlurbs[e.key]}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={sectionHeading}>{t.internal.status}</h2>
          {counts === null ? (
            <p style={muted}>{t.common.loading}</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <StatRow label={t.internal.statNotes} value={counts.notes} />
              <StatRow label={t.internal.statInsights} value={counts.insights} />
              <StatRow label={t.internal.statResources} value={counts.resources} />
            </ul>
          )}
          <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginTop: space.s16 }}>
            {t.internal.statFootnote}
          </p>
        </section>
      </div>
    </main>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <li
      style={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: `1px solid ${colors.borderSubtle}`,
        padding: `${space.s8} 0`,
      }}
    >
      <span style={{ ...typography.sizes.t14, color: colors.textMuted }}>{label}</span>
      <span style={{ ...typography.sizes.t16, fontWeight: typography.weights.medium, color: colors.textBody }}>
        {value}
      </span>
    </li>
  );
}

const sectionHeading: React.CSSProperties = {
  ...typography.sizes.t12,
  fontWeight: typography.weights.medium,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: colors.textMuted,
  marginBottom: space.s16,
};

const muted: React.CSSProperties = {
  ...typography.sizes.t14,
  color: colors.textMuted,
};
