"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FONT_STACK, colors, radius, space, typography } from "@/lib/design-tokens";
import ContactForm from "@/components/ContactForm";
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
        <p style={{ ...typography.sizes.t16, color: colors.textMuted, marginTop: 10 }}>
          {t.internal.welcomeTo}
        </p>
        <h1 className="[font-size:40px] [font-weight:700] [letter-spacing:-0.02em] [color:#2a2859] [margin:0_0_12px]">
          {t.internal.heading}
        </h1>
        {/* The one global honesty line, per §6.4: mark what is finished, not
            what is in progress — in-progress is almost everything. */}
        <p style={{ ...typography.sizes.t28, color: colors.textBody, marginTop: 24 }}>
          {t.internal.workbench}
        </p>
      </header>

      {/* Meldingsskjemaet. Boblen nede til høyre dekker resten av plattformen,
          men her — der folk lander etter innlogging — ligger det åpent, uten
          et klikk foran seg. */}
      <section
        style={{
          marginTop: space.s48,
          paddingTop: space.s32,
          borderTop: `1px solid ${colors.borderSubtle}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: space.s24,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: space.s32,
            padding: space.s24,
            background: colors.bgCard,
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: radius.lg,
          }}
        >
          <ProfilePhoto src="/images/bjorn.jpg" name="Bjørn Ravlo-Leira" size={80} />
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <h2
              style={{
                ...typography.sizes.t18,
                fontWeight: typography.weights.regular,
                color: colors.textBody,
                letterSpacing: "-0.01em",
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {t.internal.contactLead}{" "}
              <a
                href="tel:+4795463335"
                style={{
                  color: colors.brandWarmBlue,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  whiteSpace: "nowrap",
                }}
              >
                +47 954 63 335
              </a>
              .
            </h2>
          </div>
        </div>
        <ContactForm />
      </section>

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
          background: colors.brandDarkBlue,
          color: colors.textLight,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size / 2.6),
          fontWeight: typography.weights.bold,
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
        border: `2px solid ${colors.borderSubtle}`,
      }}
    />
  );
}
