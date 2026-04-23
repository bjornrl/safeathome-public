"use client";

import { useMemo, useState } from "react";
import ResourceList from "@/components/ResourceList";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import type { CareFriction, CareQuality, PublicResource, PublicStory } from "@/lib/types";
import type { ResourceLinksByResource } from "@/lib/queries";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];

/**
 * Filtering rule:
 *   AND across categories, OR within a category.
 *   e.g. {frictions: [rotate, isolate], qualities: [cultural_anchoring]}
 *   matches resources that are tied to (rotate OR isolate) AND cultural_anchoring.
 */
export default function ReadingRoomClient({
  resources,
  links,
  storiesById,
}: {
  resources: PublicResource[];
  links: ResourceLinksByResource;
  storiesById: Record<string, PublicStory>;
}) {
  const [selectedFrictions, setSelectedFrictions] = useState<CareFriction[]>([]);
  const [selectedQualities, setSelectedQualities] = useState<CareQuality[]>([]);

  const activeFilters = selectedFrictions.length + selectedQualities.length;

  const filtered = useMemo(() => {
    if (activeFilters === 0) return resources;
    return resources.filter((r) => {
      const l = links[r.id];
      const f = l?.frictions ?? [];
      const q = l?.qualities ?? [];
      if (selectedFrictions.length > 0 && !selectedFrictions.some((k) => f.includes(k))) return false;
      if (selectedQualities.length > 0 && !selectedQualities.some((k) => q.includes(k))) return false;
      return true;
    });
  }, [resources, links, selectedFrictions, selectedQualities, activeFilters]);

  const clearAll = () => {
    setSelectedFrictions([]);
    setSelectedQualities([]);
  };

  const toggleFriction = (k: CareFriction) => {
    setSelectedFrictions((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };
  const toggleQuality = (k: CareQuality) => {
    setSelectedQualities((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <section style={{ marginBottom: 32, padding: 20, background: "#f9f9f9", border: "1px solid #e6e6e6", borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#808080" }}>
            Filter
          </p>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontSize: 12,
                color: "#1f42aa",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontFamily: FONT_STACK,
              }}
            >
              Clear filters ({activeFilters})
            </button>
          )}
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, color: "#666666", marginBottom: 8 }}>Frictions</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {FRICTION_KEYS.map((k) => {
            const active = selectedFrictions.includes(k);
            const color = FRICTIONS[k].color;
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleFriction(k)}
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: 4,
                  border: `1px solid ${active ? color : color + "55"}`,
                  background: active ? color : color + "15",
                  color: active ? "#ffffff" : color,
                  cursor: "pointer",
                }}
              >
                {FRICTIONS[k].label}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, color: "#666666", marginBottom: 8 }}>Qualities</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {QUALITY_KEYS.map((k) => {
            const active = selectedQualities.includes(k);
            const color = QUALITIES[k].color;
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleQuality(k)}
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: 4,
                  border: `1px solid ${active ? color : color + "55"}`,
                  background: active ? color : color + "15",
                  color: active ? "#ffffff" : color,
                  cursor: "pointer",
                }}
              >
                {QUALITIES[k].label}
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 && activeFilters > 0 ? (
        <div style={{ padding: 24, background: "#ffffff", border: "1px dashed #e6e6e6", borderRadius: 8 }}>
          <p style={{ fontSize: 15, color: "#666666", marginBottom: 12 }}>
            No resources match these filters.
          </p>
          <button
            type="button"
            onClick={clearAll}
            style={{
              fontFamily: FONT_STACK,
              fontSize: 13,
              color: "#1f42aa",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              padding: 0,
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ResourceList
          resources={filtered}
          emptyMessage="No publications yet. Check back once the first working papers are out."
          groupByType={activeFilters === 0}
          links={links}
          storiesById={storiesById}
        />
      )}
    </div>
  );
}
