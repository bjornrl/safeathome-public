"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { colors, space, typography } from "@/lib/design-tokens";
import { Card } from "@/components/ui";
import type { WelfareTechnology } from "@/lib/types";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

const ALL = "__all__";

function uniqCategories(items: WelfareTechnology[]): string[] {
  const set = new Set<string>();
  for (const i of items) if (i.category && i.category.trim()) set.add(i.category.trim());
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function WelfareTechClient({ items }: { items: WelfareTechnology[] }) {
  const [active, setActive] = useState<string>(ALL);
  const categories = useMemo(() => uniqCategories(items), [items]);

  const visible = useMemo(() => {
    if (active === ALL) return items;
    return items.filter((i) => (i.category ?? "").trim() === active);
  }, [items, active]);

  return (
    <main
      id="main-content"
      style={{
        fontFamily: FONT_STACK,
        background: colors.bg,
        color: colors.textBody,
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: `${space.s64} ${space.s24} ${space.s40}`,
        }}
      >
        <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>
          Velferdsteknologi
        </p>
        <h1
          style={{
            ...typography.sizes.t40,
            fontWeight: typography.weights.bold,
            color: colors.textBody,
            letterSpacing: "-0.02em",
            marginBottom: space.s24,
            maxWidth: "20ch",
          }}
        >
          En kuratert oversikt — som inspirasjon, ikke produktkatalog.
        </h1>
        <p
          style={{
            ...typography.sizes.t18,
            color: colors.textMuted,
            maxWidth: "680px",
            marginBottom: space.s24,
            lineHeight: 1.7,
          }}
        >
          Velferdsteknologi som er relevant for hjemmebasert omsorg for eldre med
          innvandrerbakgrunn — utvalgt og kommentert av SAFE@HOME-prosjektet. Bruk dette som
          inspirasjon og referanse, ikke som anbefaling.
        </p>
        <p
          style={{
            ...typography.sizes.t14,
            color: colors.textMuted,
            maxWidth: "680px",
          }}
        >
          Vil du foreslå et tillegg? Skriv en{" "}
          <Link href="/admin?tab=notes" style={{ color: colors.brandWarmBlue, fontWeight: typography.weights.medium }}>
            quick note
          </Link>{" "}
          internt — så plukker en kurator det opp.
        </p>
      </section>

      {categories.length > 0 && (
        <section style={{ borderTop: `1px solid ${colors.borderSubtle}`, borderBottom: `1px solid ${colors.borderSubtle}` }}>
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              padding: `${space.s16} ${space.s24}`,
              display: "flex",
              flexWrap: "wrap",
              gap: space.s8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                ...typography.sizes.t12,
                fontWeight: typography.weights.bold,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: colors.textMuted,
                marginRight: space.s8,
              }}
            >
              Filter
            </span>
            <CategoryPill active={active === ALL} onClick={() => setActive(ALL)}>
              Alle
            </CategoryPill>
            {categories.map((c) => (
              <CategoryPill key={c} active={active === c} onClick={() => setActive(c)}>
                {c}
              </CategoryPill>
            ))}
          </div>
        </section>
      )}

      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: `${space.s40} ${space.s24} ${space.s104}`,
        }}
      >
        {visible.length === 0 ? (
          <p
            style={{
              ...typography.sizes.t16,
              color: colors.textMuted,
              padding: space.s40,
              border: `1px dashed ${colors.borderSubtle}`,
              textAlign: "center",
            }}
          >
            Ingen oppføringer ennå. Kuratorer legger til etter hvert som teknologiene dukker
            opp i feltarbeidet.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: space.s24,
            }}
          >
            {visible.map((item) => (
              <li key={item.id} style={{ display: "flex" }}>
                <TechCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...typography.sizes.t14,
        padding: `${space.s4} ${space.s12}`,
        background: active ? colors.brandDarkBlue : "transparent",
        color: active ? colors.textLight : colors.textBody,
        border: `1px solid ${active ? colors.brandDarkBlue : colors.borderSubtle}`,
        cursor: "pointer",
        fontFamily: FONT_STACK,
        fontWeight: typography.weights.medium,
      }}
    >
      {children}
    </button>
  );
}

function TechCard({ item }: { item: WelfareTechnology }) {
  return (
    <Card padding="md" style={{ display: "flex", flexDirection: "column", flex: 1, gap: space.s12 }}>
      {item.image_url && (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: `${colors.bgSubtle} center/cover no-repeat url(${JSON.stringify(item.image_url)})`,
            border: `1px solid ${colors.borderSubtle}`,
          }}
          aria-hidden
        />
      )}
      {item.category && (
        <span
          style={{
            alignSelf: "flex-start",
            ...typography.sizes.t12,
            padding: `2px ${space.s8}`,
            background: colors.brandBlueFaded,
            color: colors.brandDarkBlue,
            border: `1px solid ${colors.brandDarkBlue}`,
            borderRadius: 4,
            fontWeight: typography.weights.medium,
          }}
        >
          {item.category}
        </span>
      )}
      <h3
        style={{
          ...typography.sizes.t20,
          fontWeight: typography.weights.medium,
          color: colors.textBody,
          letterSpacing: "-0.01em",
        }}
      >
        {item.title}
      </h3>
      <p
        style={{
          ...typography.sizes.t14,
          color: colors.textBody,
          lineHeight: 1.6,
        }}
      >
        {item.description}
      </p>
      {(item.manufacturer || (item.country_availability && item.country_availability.length > 0)) && (
        <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>
          {item.manufacturer}
          {item.manufacturer && item.country_availability && item.country_availability.length > 0 ? " · " : ""}
          {item.country_availability?.join(", ")}
        </p>
      )}
      {item.notes && (
        <aside
          style={{
            background: colors.bgSubtle,
            borderLeft: `3px solid ${colors.borderSubtle}`,
            padding: `${space.s8} ${space.s12}`,
            ...typography.sizes.t12,
            color: colors.textMuted,
            lineHeight: 1.55,
            fontStyle: "italic",
          }}
        >
          <span
            style={{
              ...typography.sizes.t12,
              fontWeight: typography.weights.bold,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: colors.textMuted,
              fontStyle: "normal",
              marginRight: space.s4,
            }}
          >
            Kuratornotat:
          </span>
          {item.notes}
        </aside>
      )}
      {item.tags && item.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4 }}>
          {item.tags.map((t) => (
            <span
              key={t}
              style={{
                ...typography.sizes.t12,
                padding: `2px ${space.s8}`,
                background: colors.bgSubtle,
                color: colors.textMuted,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: 4,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...typography.sizes.t14,
            color: colors.brandWarmBlue,
            textDecoration: "none",
            fontWeight: typography.weights.medium,
            marginTop: "auto",
            paddingTop: space.s8,
            borderTop: `1px solid ${colors.borderSubtle}`,
          }}
        >
          Lær mer →
        </a>
      )}
    </Card>
  );
}
