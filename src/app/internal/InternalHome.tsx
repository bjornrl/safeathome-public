"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";

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

const ENTRANCES = [
  {
    href: "/internal/content?tab=search",
    label: "Søk",
    blurb: "Hele korpuset i én liste. Søk smalner den inn.",
  },
  {
    href: "/internal/content?tab=nodes",
    label: "Nodekart",
    blurb: "Notater og innsikter koblet av det de deler.",
  },
  {
    href: "/internal/content?tab=frictions",
    label: "Friksjoner",
    blurb: "De sju mekanismene der omsorg går galt.",
  },
  {
    href: "/internal/content?tab=qualities",
    label: "Kvaliteter",
    blurb: "Det som gjør omsorg god når den treffer.",
  },
  {
    href: "/internal/content?tab=resources",
    label: "Ressurser",
    blurb: "Publikasjoner, policy-notater og kommunale erfaringer.",
  },
  {
    href: "/admin",
    label: "Redigering",
    blurb: "Skriv og rediger notater, innsikter og ressurser.",
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
}

export default function InternalHome() {
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
          Analysebordet for SAFE@HOME
        </h1>
        {/* The one global honesty line, per §6.4: mark what is finished, not
            what is in progress — in-progress is almost everything. */}
        <p style={{ ...typography.sizes.t16, color: colors.textMuted, margin: 0 }}>
          Alt her er arbeid under utvikling.
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
          <h2 style={sectionHeading}>Siste notater</h2>
          {notes === null ? (
            <p style={muted}>Laster…</p>
          ) : notes.length === 0 ? (
            <p style={muted}>Ingen notater ennå. Det første som legges inn, dukker opp her.</p>
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
                    href="/admin?tab=notes"
                    style={{
                      ...typography.sizes.t16,
                      color: colors.textBody,
                      textDecoration: "none",
                      fontWeight: typography.weights.medium,
                      display: "block",
                    }}
                  >
                    {n.headline?.trim() || n.body.slice(0, 60) || "(uten tittel)"}
                  </Link>
                  <span style={{ ...typography.sizes.t12, color: colors.textMuted }}>
                    {(n.author_id && authors[n.author_id]) || "Ukjent"} · {formatDate(n.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 style={sectionHeading}>Innganger</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {ENTRANCES.map((e) => (
              <li key={e.href} style={{ marginBottom: space.s16 }}>
                <Link
                  href={e.href}
                  style={{
                    ...typography.sizes.t16,
                    color: colors.brandWarmBlue,
                    fontWeight: typography.weights.medium,
                    textDecoration: "none",
                  }}
                >
                  {e.label}
                </Link>
                <p style={{ ...typography.sizes.t14, color: colors.textMuted, margin: `2px 0 0` }}>
                  {e.blurb}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={sectionHeading}>Status</h2>
          {counts === null ? (
            <p style={muted}>Laster…</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <StatRow label="Hurtignotater" value={counts.notes} />
              <StatRow label="Innsikter" value={counts.insights} />
              <StatRow label="Ressurser" value={counts.resources} />
            </ul>
          )}
          <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginTop: space.s16 }}>
            Datainnsamlingen i Alna, Søndre Nordstrand og Skien starter høsten
            2026. Tallene her vokser i takt med den.
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
