"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import { Footer } from "@/components/ui";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import { colors, motion, radius, space, typography } from "@/lib/design-tokens";
import type { PublicStory } from "@/lib/types";

export default function IndexClient({ stories }: { stories: PublicStory[] }) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const copy = [...stories];
    copy.sort((a, b) => a.title.localeCompare(b.title, "nb-NO", { sensitivity: "base" }));
    return copy;
  }, [stories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(s => s.title.toLowerCase().includes(q));
  }, [sorted, query]);

  return (
    <>
      <Nav />
      <main id="main-content" style={{ background: colors.bg, color: colors.textBody }}>
        <section>
          <div style={{ maxWidth: "960px", margin: "0 auto", padding: `${space.s64} ${space.s24} ${space.s32}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s16 }}>Register</p>
            <h1 style={{ marginBottom: space.s16, maxWidth: "16ch" }}>Alle innsikter, alfabetisk.</h1>
            <p style={{ ...typography.sizes.t18, color: colors.textMuted, maxWidth: "680px", marginBottom: space.s32 }}>
              Kjenner du tittelen, finn den fort. Skriv i søkefeltet for å filtrere listen.
            </p>

            <label style={{ display: "flex", flexDirection: "column", gap: space.s8, marginBottom: space.s32 }}>
              <span style={{ ...typography.sizes.t14, fontWeight: typography.weights.medium }}>Søk</span>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Skriv en tittel…"
                aria-label="Søk i innsikter"
                style={{
                  padding: `${space.s12} ${space.s16}`,
                  fontFamily: typography.fontFamily,
                  fontSize: "16px",
                  lineHeight: "24px",
                  fontWeight: typography.weights.light,
                  color: colors.textBody,
                  background: colors.bgCard,
                  border: `1px solid ${colors.borderGray}`,
                  borderRadius: radius.none,
                  width: "100%",
                  maxWidth: "520px",
                  transition: `border-color ${motion.fast}`,
                }}
              />
            </label>

            <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginBottom: space.s16 }}>
              {filtered.length === sorted.length
                ? `${sorted.length} innsikter`
                : `${filtered.length} av ${sorted.length} innsikter`}
            </p>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `1px solid ${colors.borderSubtle}` }}>
              {filtered.map(s => (
                <li key={s.id} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <Link
                    href={`/story/${s.id}`}
                    style={{
                      display: "block",
                      padding: `${space.s16} 0`,
                      textDecoration: "none",
                      color: colors.textBody,
                    }}
                  >
                    <p style={{ ...typography.sizes.t18, fontWeight: typography.weights.medium, marginBottom: space.s4 }}>
                      {s.title}
                    </p>
                    <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>
                      {bylineFor(s)}
                    </p>
                  </Link>
                </li>
              ))}
              {filtered.length === 0 && (
                <li style={{ padding: `${space.s24} 0`, ...typography.sizes.t16, color: colors.textMuted, fontStyle: "italic" }}>
                  Ingen treff.
                </li>
              )}
            </ul>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}

function bylineFor(s: PublicStory): string {
  const parts: string[] = [];
  if (s.field_site) parts.push(s.field_site);
  const cats: string[] = [
    ...(s.frictions ?? []).map(f => FRICTIONS[f]?.label).filter(Boolean) as string[],
    ...(s.qualities ?? []).map(q => QUALITIES[q]?.label).filter(Boolean) as string[],
  ];
  if (cats.length > 0) parts.push(cats.join(", "));
  return parts.join(" · ");
}
