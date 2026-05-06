"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SuggestedCategory } from "@/lib/types";
import { colors, space, typography } from "@/lib/design-tokens";
import { CategoryBadge } from "./CategoryBadge";

interface Props {
  selected: SuggestedCategory[];
  onChange: (next: SuggestedCategory[]) => void;
  authorId: string | null;
}

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

const inputStyle: React.CSSProperties = {
  padding: `${space.s8} ${space.s12}`,
  border: `1px solid ${colors.borderSubtle}`,
  fontSize: 14,
  fontFamily: FONT_STACK,
  background: colors.bgCard,
  color: colors.textBody,
  width: "100%",
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function SuggestedCategoryInput({ selected, onChange, authorId }: Props) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SuggestedCategory[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error: searchErr } = await supabase
        .from("suggested_categories")
        .select("*")
        .ilike("label", `%${trimmed}%`)
        .order("label", { ascending: true })
        .limit(8);
      if (!active) return;
      setSearching(false);
      if (searchErr) {
        setError(searchErr.message);
        setMatches([]);
        return;
      }
      setMatches((data ?? []) as SuggestedCategory[]);
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  function attach(s: SuggestedCategory) {
    if (selectedIds.has(s.id)) return;
    onChange([...selected, s]);
    setQuery("");
    setMatches([]);
  }

  function detach(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  async function createAndAttach() {
    const label = query.trim();
    if (!label) return;
    const lower = normalize(label);

    // Local dedupe — match selected
    const inSelected = selected.find((s) => normalize(s.label) === lower);
    if (inSelected) {
      setQuery("");
      return;
    }
    // Server dedupe — match an existing row before inserting
    const existing = matches.find((m) => normalize(m.label) === lower);
    if (existing) {
      attach(existing);
      return;
    }

    setCreating(true);
    setError(null);
    const { data, error: insertErr } = await supabase
      .from("suggested_categories")
      .insert({
        label,
        suggested_by: authorId,
        status: "pending",
      })
      .select("*")
      .single();
    setCreating(false);
    if (insertErr || !data) {
      setError(insertErr?.message ?? "Failed to create suggestion.");
      return;
    }
    attach(data as SuggestedCategory);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void createAndAttach();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4 }}>
          {selected.map((s) => (
            <span
              key={s.id}
              style={{ display: "inline-flex", alignItems: "center", gap: space.s4 }}
            >
              <CategoryBadge kind="dashed" title="Foreslått kategori">
                {s.label}
              </CategoryBadge>
              <button
                type="button"
                onClick={() => detach(s.id)}
                aria-label={`Fjern ${s.label}`}
                style={{
                  ...typography.sizes.t12,
                  background: "transparent",
                  border: "none",
                  color: colors.textMuted,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: FONT_STACK,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Foreslå en ny kategori — f.eks. «søvn på fellesrom»"
          style={inputStyle}
        />
        {query.trim().length >= 2 && matches.length > 0 && (
          <ul
            role="listbox"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              listStyle: "none",
              margin: 0,
              padding: 0,
              background: colors.bgCard,
              border: `1px solid ${colors.borderSubtle}`,
              maxHeight: 220,
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {matches
              .filter((m) => !selectedIds.has(m.id))
              .map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => attach(m)}
                    style={{
                      ...typography.sizes.t14,
                      width: "100%",
                      textAlign: "left",
                      padding: `${space.s8} ${space.s12}`,
                      background: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${colors.borderSubtle}`,
                      cursor: "pointer",
                      color: colors.textBody,
                      fontFamily: FONT_STACK,
                    }}
                  >
                    <span style={{ fontWeight: typography.weights.medium }}>{m.label}</span>
                    {m.status !== "pending" && (
                      <span
                        style={{
                          marginLeft: space.s8,
                          ...typography.sizes.t12,
                          color: m.status === "approved" ? "#034b45" : "#a83f34",
                        }}
                      >
                        ({m.status})
                      </span>
                    )}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div style={{ display: "flex", gap: space.s8, alignItems: "center" }}>
        <button
          type="button"
          onClick={createAndAttach}
          disabled={query.trim().length === 0 || creating}
          style={{
            ...typography.sizes.t12,
            padding: `${space.s4} ${space.s12}`,
            background: query.trim() ? colors.brandWarmBlue : colors.bgSubtle,
            color: query.trim() ? colors.textLight : colors.textMuted,
            border: `1px solid ${query.trim() ? colors.brandWarmBlue : colors.borderSubtle}`,
            cursor: query.trim() ? "pointer" : "not-allowed",
            fontFamily: FONT_STACK,
            fontWeight: typography.weights.medium,
          }}
        >
          {creating ? "Lagrer…" : "Foreslå"}
        </button>
        {searching && (
          <span style={{ ...typography.sizes.t12, color: colors.textMuted }}>
            Søker…
          </span>
        )}
        {error && (
          <span style={{ ...typography.sizes.t12, color: "#a83f34" }}>{error}</span>
        )}
      </div>
    </div>
  );
}
