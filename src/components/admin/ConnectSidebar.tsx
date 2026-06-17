"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";
import {
  ENTITY_KIND_LABELS,
  entityLinkKey,
  type EntityLinkKind,
} from "@/lib/entity-links";
import type { LinkableEntity } from "@/lib/types";
import { FONT_STACK, SUGGEST_ACCENT, inputStyle, labelStyle } from "./FormPrimitives";

export function ConnectSidebar({
  exclude,
  linked,
  setLinked,
  suggestedKeys,
  onAcceptSuggested,
  onDismissSuggested,
}: {
  /** Hide the entity being edited from the list. */
  exclude?: { kind: EntityLinkKind; id: string };
  linked: Set<string>;
  setLinked: (next: Set<string>) => void;
  suggestedKeys?: Set<string>;
  onAcceptSuggested?: (key: string) => void;
  onDismissSuggested?: (key: string) => void;
}) {
  const [items, setItems] = useState<LinkableEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const [notesRes, insightsRes, storiesRes, resourcesRes] = await Promise.all([
        supabase
          .from("quick_notes")
          .select("id, headline, body, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("insights")
          .select("id, title, body, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("public_stories")
          .select("id, title, body, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("public_resources")
          .select("id, title, description, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);
      if (!active) return;

      const all: LinkableEntity[] = [];

      for (const n of (notesRes.data as { id: string; headline: string | null; body: string; updated_at: string }[] | null) ?? []) {
        if (exclude?.kind === "quick_note" && exclude.id === n.id) continue;
        all.push({
          kind: "quick_note",
          id: n.id,
          title: n.headline?.trim() || (n.body.length > 60 ? `${n.body.slice(0, 60)}…` : n.body),
          subtitle: null,
          updated_at: n.updated_at,
        });
      }
      for (const i of (insightsRes.data as { id: string; title: string; body: string; updated_at: string }[] | null) ?? []) {
        if (exclude?.kind === "insight" && exclude.id === i.id) continue;
        all.push({
          kind: "insight",
          id: i.id,
          title: i.title,
          subtitle: i.body.length > 80 ? `${i.body.slice(0, 80)}…` : i.body,
          updated_at: i.updated_at,
        });
      }
      for (const s of (storiesRes.data as { id: string; title: string; body: string; updated_at: string }[] | null) ?? []) {
        if (exclude?.kind === "story" && exclude.id === s.id) continue;
        all.push({
          kind: "story",
          id: s.id,
          title: s.title,
          subtitle: s.body.length > 80 ? `${s.body.slice(0, 80)}…` : s.body,
          updated_at: s.updated_at,
        });
      }
      for (const r of (resourcesRes.data as { id: string; title: string; description: string | null; updated_at: string }[] | null) ?? []) {
        if (exclude?.kind === "resource" && exclude.id === r.id) continue;
        all.push({
          kind: "resource",
          id: r.id,
          title: r.title,
          subtitle: r.description
            ? r.description.length > 80
              ? `${r.description.slice(0, 80)}…`
              : r.description
            : null,
          updated_at: r.updated_at,
        });
      }

      all.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
      setItems(all);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [exclude?.kind, exclude?.id]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.subtitle ?? "").toLowerCase().includes(q) ||
        ENTITY_KIND_LABELS[it.kind].toLowerCase().includes(q),
    );
  }, [items, filter]);

  function toggle(it: LinkableEntity) {
    const key = entityLinkKey(it.kind, it.id);
    const next = new Set(linked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setLinked(next);
    if (suggestedKeys?.has(key)) onAcceptSuggested?.(key);
  }

  const ordered = useMemo(() => {
    if (!suggestedKeys || suggestedKeys.size === 0) return visible;
    const sug: LinkableEntity[] = [];
    const rest: LinkableEntity[] = [];
    for (const it of visible) {
      const key = entityLinkKey(it.kind, it.id);
      if (suggestedKeys.has(key)) sug.push(it);
      else rest.push(it);
    }
    return [...sug, ...rest];
  }, [visible, suggestedKeys]);

  return (
    <aside
      style={{
        position: "sticky",
        top: space.s24,
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        padding: space.s16,
        display: "flex",
        flexDirection: "column",
        gap: space.s12,
        maxHeight: "80vh",
      }}
    >
      <div>
        <p style={labelStyle}>Koble til andre</p>
        <p style={{ ...typography.sizes.t12, color: colors.textMuted, marginTop: space.s4 }}>
          Notater, innsikter og ressurser i korpuset
        </p>
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Søk…"
        style={inputStyle}
      />
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {loading ? (
          <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>Laster…</p>
        ) : ordered.length === 0 ? (
          <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>Ingen treff.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: space.s4,
            }}
          >
            {ordered.map((it) => {
              const key = entityLinkKey(it.kind, it.id);
              const on = linked.has(key);
              const suggested = suggestedKeys?.has(key) ?? false;
              return (
                <li key={key}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: space.s8,
                      padding: `${space.s8} ${space.s12}`,
                      cursor: "pointer",
                      background: on
                        ? colors.brandBlueFaded
                        : suggested
                          ? `${SUGGEST_ACCENT}10`
                          : "transparent",
                      border: `1px ${suggested && !on ? "dashed" : "solid"} ${
                        on ? colors.brandWarmBlue : suggested ? SUGGEST_ACCENT : "transparent"
                      }`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(it)}
                      style={{
                        marginTop: 3,
                        accentColor: suggested ? SUGGEST_ACCENT : colors.brandWarmBlue,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: space.s8,
                          marginBottom: 2,
                        }}
                      >
                        <p
                          style={{
                            ...typography.sizes.t12,
                            color: colors.textMuted,
                            fontWeight: typography.weights.bold,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {ENTITY_KIND_LABELS[it.kind]}
                        </p>
                        {suggested && (
                          <span
                            style={{
                              ...typography.sizes.t12,
                              color: SUGGEST_ACCENT,
                              fontWeight: typography.weights.bold,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            ✦ Foreslått
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          ...typography.sizes.t14,
                          color: colors.textBody,
                          fontWeight: typography.weights.medium,
                          marginBottom: 2,
                        }}
                      >
                        {it.title || "(Uten tittel)"}
                      </p>
                      {it.subtitle && (
                        <p
                          style={{
                            ...typography.sizes.t12,
                            color: colors.textMuted,
                            lineHeight: 1.45,
                          }}
                        >
                          {it.subtitle}
                        </p>
                      )}
                      {suggested && !on && onDismissSuggested && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDismissSuggested(key);
                          }}
                          style={{
                            ...typography.sizes.t12,
                            background: "transparent",
                            border: "none",
                            color: colors.textMuted,
                            cursor: "pointer",
                            padding: 0,
                            marginTop: space.s4,
                            fontFamily: FONT_STACK,
                          }}
                        >
                          × Avvis forslag
                        </button>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
