"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { colors, space, typography } from "@/lib/design-tokens";
import { supabase } from "@/lib/supabase";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const categories = useMemo(() => uniqCategories(items), [items]);

  const visible = useMemo(() => {
    if (active === ALL) return items;
    return items.filter((i) => (i.category ?? "").trim() === active);
  }, [items, active]);

  const selectedIndex = useMemo(
    () => (selectedId ? visible.findIndex((i) => i.id === selectedId) : -1),
    [visible, selectedId],
  );
  const selected = selectedIndex >= 0 ? visible[selectedIndex] : null;

  const close = useCallback(() => setSelectedId(null), []);
  const goPrev = useCallback(() => {
    if (selectedIndex > 0) setSelectedId(visible[selectedIndex - 1].id);
  }, [selectedIndex, visible]);
  const goNext = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < visible.length - 1) {
      setSelectedId(visible[selectedIndex + 1].id);
    }
  }, [selectedIndex, visible]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setIsAdmin((profile as { role?: string } | null)?.role === "admin");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, close, goPrev, goNext]);

  // Filter change drops the open detail if it falls out of the new view.
  useEffect(() => {
    if (selectedId && !visible.some((i) => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visible, selectedId]);

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
      {/* ── Section 1: header ───────────────────────────────── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: `${space.s64} ${space.s24} ${space.s32}`,
        }}
      >
        <h1
          style={{
            ...typography.sizes.t40,
            fontWeight: typography.weights.bold,
            color: colors.textBody,
            letterSpacing: "-0.02em",
            marginBottom: space.s32,
          }}
        >
          Velferdsteknologi
        </h1>

        <div
          role="tablist"
          aria-label="Filtrer etter kategori"
          style={{
            display: "flex",
            gap: space.s8,
            overflowX: "auto",
            paddingBottom: space.s8,
            marginBottom: space.s24,
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            flexWrap: "nowrap",
          }}
        >
          <FilterPill active={active === ALL} onClick={() => setActive(ALL)}>
            Vis alt
          </FilterPill>
          {categories.map((c) => (
            <FilterPill key={c} active={active === c} onClick={() => setActive(c)}>
              {c}
            </FilterPill>
          ))}
        </div>

        <p
          style={{
            ...typography.sizes.t18,
            color: colors.textMuted,
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          En kuratert oversikt over velferdsteknologi som er relevant for hjemmebasert
          omsorg for eldre med innvandrerbakgrunn. Utvalget er gjort av SAFE@HOME-prosjektet
          som inspirasjon og referanse — ikke som anbefaling.
        </p>

        {isAdmin && (
          <Link
            href="/admin?tab=welfare-tech"
            style={{
              display: "inline-block",
              marginTop: space.s16,
              ...typography.sizes.t12,
              color: colors.brandWarmBlue,
              textDecoration: "none",
              borderBottom: `1px dashed ${colors.brandWarmBlue}`,
              paddingBottom: 2,
              fontWeight: typography.weights.medium,
            }}
          >
            + Legg til / rediger oppføringer
          </Link>
        )}
      </section>

      {/* ── Section 2: grid ─────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: `${space.s24} ${space.s24} ${space.s104}`,
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
            Ingen oppføringer i denne kategorien ennå.
          </p>
        ) : (
          <motion.ul
            layout
            className="welfare-grid"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              columnGap: space.s24,
              rowGap: space.s32,
            }}
          >
            <AnimatePresence mode="popLayout">
              {visible.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <GridCard
                    item={item}
                    selected={selectedId === item.id}
                    onClick={() => setSelectedId(item.id)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>

      {/* ── Section 3: detail panel ─────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <DetailPanel
            key={selected.id}
            item={selected}
            index={selectedIndex}
            total={visible.length}
            onClose={close}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
      </AnimatePresence>

      {/* Responsive grid: 2 col default (mobile), 3 col tablet, 5 col desktop.
          Plus hide the horizontal scrollbar on filter row. */}
      <style jsx global>{`
        .welfare-grid > li > * { width: 100%; }
        .welfare-detail-panel { width: 100vw; }
        @media (min-width: 768px) {
          .welfare-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .welfare-detail-panel {
            width: 60vw;
            min-width: 480px;
          }
        }
        @media (min-width: 1100px) {
          .welfare-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }
        }
        [role="tablist"]::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}

// ─── Filter pill ──────────────────────────────────────────────

function FilterPill({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        ...typography.sizes.t14,
        padding: `${space.s8} ${space.s16}`,
        background: active ? colors.brandDarkBlue : "transparent",
        color: active ? colors.textLight : colors.textBody,
        border: `1px solid ${active ? colors.brandDarkBlue : colors.borderSubtle}`,
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: FONT_STACK,
        fontWeight: typography.weights.medium,
        whiteSpace: "nowrap",
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Grid card ────────────────────────────────────────────────

function GridCard({
  item,
  selected,
  onClick,
}: {
  item: WelfareTechnology;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: space.s12,
        width: "100%",
        textAlign: "left",
        fontFamily: FONT_STACK,
        outline: selected ? `2px solid ${colors.brandWarmBlue}` : "none",
        outlineOffset: 4,
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          background: item.image_url
            ? `${colors.bgSubtle} center/cover no-repeat url(${JSON.stringify(item.image_url)})`
            : colors.bgSubtle,
          position: "relative",
          overflow: "hidden",
        }}
        aria-hidden
      >
        {!item.image_url && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...typography.sizes.t12,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            ingen bilde
          </span>
        )}
      </div>
      <span
        style={{
          ...typography.sizes.t12,
          color: colors.textBody,
          fontWeight: typography.weights.medium,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          lineHeight: 1.4,
        }}
      >
        {item.title}
      </span>
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────

function DetailPanel({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: WelfareTechnology;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  return (
    <>
      {/* Dimmed clickable overlay over the remaining ~40% of the screen. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(42, 40, 89, 0.35)",
          zIndex: 40,
        }}
      />

      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="welfare-detail-title"
        className="welfare-detail-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          background: colors.bgCard,
          borderLeft: `1px solid ${colors.borderSubtle}`,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT_STACK,
          boxShadow: "-12px 0 32px rgba(42, 40, 89, 0.12)",
        }}
      >
        {/* Header bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${space.s16} ${space.s24}`,
            borderBottom: `1px solid ${colors.borderSubtle}`,
            flexShrink: 0,
            background: colors.bgCard,
          }}
        >
          <span
            style={{
              ...typography.sizes.t12,
              fontWeight: typography.weights.bold,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: colors.textMuted,
            }}
          >
            {item.category?.trim() || "Uten kategori"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            style={{
              background: "transparent",
              border: "none",
              fontSize: 28,
              lineHeight: 1,
              cursor: "pointer",
              color: colors.textMuted,
              fontFamily: FONT_STACK,
              padding: 0,
            }}
          >
            ×
          </button>
        </header>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {item.image_url ? (
            <div
              style={{
                width: "100%",
                maxHeight: "45vh",
                aspectRatio: "16 / 9",
                background: `${colors.bgSubtle} center/cover no-repeat url(${JSON.stringify(item.image_url)})`,
                flexShrink: 0,
              }}
              aria-hidden
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "30vh",
                background: colors.bgSubtle,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...typography.sizes.t12,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                flexShrink: 0,
              }}
              aria-hidden
            >
              ingen bilde
            </div>
          )}

          <div
            style={{
              padding: `${space.s32} ${space.s40}`,
              display: "flex",
              flexDirection: "column",
              gap: space.s16,
              maxWidth: 720,
            }}
          >
            <h2
              id="welfare-detail-title"
              style={{
                ...typography.sizes.t30,
                fontWeight: typography.weights.bold,
                color: colors.textBody,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
              }}
            >
              {item.title}
            </h2>

            <p
              style={{
                ...typography.sizes.t16,
                color: colors.textBody,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
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
                  alignSelf: "flex-start",
                }}
              >
                Lær mer →
              </a>
            )}

            {item.notes && (
              <aside
                style={{
                  marginTop: space.s8,
                  padding: `${space.s12} ${space.s16}`,
                  background: colors.bgSubtle,
                  borderLeft: `3px solid ${colors.borderSubtle}`,
                  ...typography.sizes.t14,
                  color: colors.textMuted,
                  lineHeight: 1.6,
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4, marginTop: space.s8 }}>
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
          </div>
        </div>

        {/* Bottom bar */}
        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${space.s12} ${space.s24}`,
            borderTop: `1px solid ${colors.borderSubtle}`,
            flexShrink: 0,
            background: colors.bgCard,
          }}
        >
          <div style={{ display: "flex", gap: space.s8 }}>
            <ArrowButton onClick={onPrev} disabled={!hasPrev} label="Forrige">
              ←
            </ArrowButton>
            <ArrowButton onClick={onNext} disabled={!hasNext} label="Neste">
              →
            </ArrowButton>
          </div>
          <span
            style={{
              ...typography.sizes.t12,
              color: colors.textMuted,
              fontWeight: typography.weights.medium,
            }}
          >
            {index + 1} av {total}
          </span>
        </footer>
      </motion.aside>
    </>
  );
}

function ArrowButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        ...typography.sizes.t16,
        padding: `${space.s4} ${space.s12}`,
        background: "transparent",
        color: disabled ? colors.borderSubtle : colors.textBody,
        border: `1px solid ${disabled ? colors.borderSubtle : colors.borderSubtle}`,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: FONT_STACK,
        opacity: disabled ? 0.5 : 1,
        minWidth: 44,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
