"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicStory, PublicConnection, CareFriction, CareQuality, MapScale } from "@/lib/types";
import { MAP_CONFIG, MAP_STYLE, FRICTIONS, QUALITIES, SCALES, DISTRICTS } from "@/lib/constants";
import { getMapStories, getConnections } from "@/lib/queries";
import Nav from "@/components/Nav";

// ─── Helpers ───

function getScale(zoom: number): MapScale {
  if (zoom >= MAP_CONFIG.microToMesoZoom) return "micro";
  if (zoom >= MAP_CONFIG.mesoToMacroZoom) return "meso";
  return "macro";
}

function primaryFrictionColor(story: PublicStory): string {
  const first = story.frictions?.[0];
  return first ? FRICTIONS[first]?.color ?? "#C45D3E" : "#C45D3E";
}

// ─── Main Component ───

export default function ExplorePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [stories, setStories] = useState<PublicStory[]>([]);
  const [connections, setConnections] = useState<PublicConnection[]>([]);
  const [zoom, setZoom] = useState(MAP_CONFIG.initialZoom);
  const [selectedStory, setSelectedStory] = useState<PublicStory | null>(null);
  const [selectedFrictions, setSelectedFrictions] = useState<CareFriction[]>([]);
  const [selectedQualities, setSelectedQualities] = useState<CareQuality[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const currentScale = getScale(zoom);

  // ─── Load data ───
  useEffect(() => {
    Promise.all([getMapStories(), getConnections()]).then(([s, c]) => {
      setStories(s);
      setConnections(c);
    });
  }, []);

  // ─── Init map ───
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE as maplibregl.StyleSpecification,
      center: MAP_CONFIG.center,
      zoom: 13,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      dragPan: true,
      dragRotate: true,
      touchPitch: true,
      pitch: 0,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("zoom", () => setZoom(map.getZoom()));
    map.on("load", () => setMapReady(true));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── Add connection lines when data + map ready ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || stories.length === 0) return;

    const storyMap = new Map(stories.map((s) => [s.id, s]));
    const features = connections
      .map((conn) => {
        const from = storyMap.get(conn.from_story_id);
        const to = storyMap.get(conn.to_story_id);
        if (!from?.latitude || !from?.longitude || !to?.latitude || !to?.longitude) return null;
        return {
          type: "Feature" as const,
          properties: {
            friction: conn.friction,
            connection_type: conn.connection_type,
            color: FRICTIONS[conn.friction]?.color ?? "#999",
          },
          geometry: {
            type: "LineString" as const,
            coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]],
          },
        };
      })
      .filter(Boolean);

    if (map.getSource("connections")) {
      (map.getSource("connections") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: features as GeoJSON.Feature[],
      });
    } else {
      map.addSource("connections", {
        type: "geojson",
        data: { type: "FeatureCollection", features: features as GeoJSON.Feature[] },
      });
      map.addLayer({
        id: "conn-solid",
        type: "line",
        source: "connections",
        filter: ["==", ["get", "connection_type"], "direct"],
        paint: { "line-color": ["get", "color"], "line-width": 2.5, "line-opacity": 0.7 },
        layout: { "line-cap": "round" },
      });
      map.addLayer({
        id: "conn-dashed",
        type: "line",
        source: "connections",
        filter: ["==", ["get", "connection_type"], "indirect"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.5,
          "line-dasharray": [4, 3],
        },
        layout: { "line-cap": "round" },
      });
    }
  }, [mapReady, stories, connections]);

  // ─── Add/update story markers ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const hasFilter = selectedFrictions.length > 0 || selectedQualities.length > 0;
    const filteredIds = hasFilter
      ? new Set(
          stories
            .filter((s) => {
              const fMatch =
                selectedFrictions.length === 0 ||
                selectedFrictions.some((f) => s.frictions?.includes(f));
              const qMatch =
                selectedQualities.length === 0 ||
                selectedQualities.some((q) => s.qualities?.includes(q));
              return fMatch && qMatch;
            })
            .map((s) => s.id),
        )
      : null;

    const visible = stories.filter((s) => {
      if (!s.latitude || !s.longitude) return false;
      if (currentScale === "macro" && s.map_scale !== "macro") return false;
      if (currentScale === "meso" && s.map_scale === "micro") return false;
      return true;
    });

    visible.forEach((s) => {
      const dimmed = filteredIds !== null && !filteredIds.has(s.id);
      const color = primaryFrictionColor(s);

      const el = document.createElement("div");
      el.style.cssText = "cursor:pointer;";

      const circle = document.createElement("div");
      circle.style.cssText = `width:26px;height:26px;border-radius:50%;background:${
        dimmed ? "#ccc" : color
      };border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);opacity:${
        dimmed ? 0.4 : 1
      };transition:transform .15s;display:flex;align-items:center;justify-content:center;`;

      const dot = document.createElement("div");
      dot.style.cssText = "width:7px;height:7px;border-radius:50%;background:#fff;";
      circle.appendChild(dot);
      el.appendChild(circle);

      el.onmouseenter = () => {
        circle.style.transform = "scale(1.25)";
      };
      el.onmouseleave = () => {
        circle.style.transform = "scale(1)";
      };
      el.onclick = (e) => {
        e.stopPropagation();
        setSelectedStory(s);
      };

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([s.longitude!, s.latitude!])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [mapReady, stories, currentScale, selectedFrictions, selectedQualities]);

  // ─── Connection line filter highlight ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("conn-solid")) return;

    if (selectedFrictions.length > 0) {
      const expr: maplibregl.ExpressionSpecification = [
        "case",
        ["in", ["get", "friction"], ["literal", selectedFrictions]],
        0.9,
        0.1,
      ];
      map.setPaintProperty("conn-solid", "line-opacity", expr);
      map.setPaintProperty("conn-dashed", "line-opacity", expr);
      map.setPaintProperty("conn-solid", "line-width", [
        "case",
        ["in", ["get", "friction"], ["literal", selectedFrictions]],
        4,
        1,
      ]);
    } else {
      map.setPaintProperty("conn-solid", "line-opacity", 0.7);
      map.setPaintProperty("conn-dashed", "line-opacity", 0.5);
      map.setPaintProperty("conn-solid", "line-width", 2.5);
    }
  }, [mapReady, selectedFrictions]);

  // ─── Actions ───
  const flyTo = useCallback((center: [number, number], z: number) => {
    mapRef.current?.flyTo({ center, zoom: z, duration: 1800 });
  }, []);

  const openStory = useCallback(
    (id: string) => {
      const s = stories.find((x) => x.id === id);
      if (!s) return;
      setSelectedStory(s);
      if (s.latitude && s.longitude) {
        flyTo(
          [s.longitude, s.latitude],
          s.map_scale === "micro" ? 18 : s.map_scale === "meso" ? 15 : 12,
        );
      }
    },
    [stories, flyTo],
  );

  const toggleFriction = useCallback((f: CareFriction) => {
    setSelectedFrictions((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));
  }, []);

  const toggleQuality = useCallback((q: CareQuality) => {
    setSelectedQualities((p) => (p.includes(q) ? p.filter((x) => x !== q) : [...p, q]));
  }, []);

  const relatedConnections = selectedStory
    ? connections.filter(
        (c) => c.from_story_id === selectedStory.id || c.to_story_id === selectedStory.id,
      )
    : [];

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <Nav variant="minimal" />

      {/* Map canvas */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* ─── District selector (top-right, below nav control) ─── */}
      <div style={{ position: "absolute", top: 60, right: 16, zIndex: 20 }}>
        <select
          onChange={(e) => {
            const d = DISTRICTS[e.target.value];
            if (d) flyTo(d.center, d.zoom);
          }}
          defaultValue=""
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #E8E4DB",
            background: "#fff",
            fontSize: 13,
            color: "#2C2A25",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          <option value="" disabled>
            Jump to district
          </option>
          {Object.entries(DISTRICTS).map(([k, d]) => (
            <option key={k} value={k}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Filter panel (top-left, offset for nav) ─── */}
      <FilterPanel
        selectedFrictions={selectedFrictions}
        selectedQualities={selectedQualities}
        onToggleFriction={toggleFriction}
        onToggleQuality={toggleQuality}
        onClear={() => {
          setSelectedFrictions([]);
          setSelectedQualities([]);
        }}
      />

      {/* ─── Zoom indicator (bottom-left) ─── */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 16,
          zIndex: 20,
          background: "rgba(255,255,255,.92)",
          padding: "8px 14px",
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,.1)",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {(["macro", "meso", "micro"] as MapScale[]).map((s) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: s !== "micro" ? 4 : 0,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: currentScale === s ? "#C45D3E" : "#E8E4DB",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: currentScale === s ? 600 : 400,
                color: currentScale === s ? "#2C2A25" : "#A09A8E",
              }}
            >
              {SCALES[s].label}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Story panel ─── */}
      <AnimatePresence>
        {selectedStory && (
          <StoryPanel
            story={selectedStory}
            connections={relatedConnections}
            allStories={stories}
            onClose={() => setSelectedStory(null)}
            onNavigate={openStory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───

function FilterPanel({
  selectedFrictions,
  selectedQualities,
  onToggleFriction,
  onToggleQuality,
  onClear,
}: {
  selectedFrictions: CareFriction[];
  selectedQualities: CareQuality[];
  onToggleFriction: (f: CareFriction) => void;
  onToggleQuality: (q: CareQuality) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const count = selectedFrictions.length + selectedQualities.length;

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 16,
        zIndex: 20,
        maxWidth: 320,
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "rgba(255,255,255,.95)",
          borderRadius: 8,
          border: "1px solid #E8E4DB",
          fontSize: 13,
          fontWeight: 500,
          color: "#2C2A25",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,.1)",
        }}
      >
        Filters
        {count > 0 && (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#C45D3E",
              color: "#fff",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            padding: 16,
            background: "rgba(255,255,255,.97)",
            borderRadius: 10,
            border: "1px solid #E8E4DB",
            boxShadow: "0 4px 16px rgba(0,0,0,.12)",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#7A756B",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Care Frictions
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {(Object.entries(FRICTIONS) as [CareFriction, (typeof FRICTIONS)[CareFriction]][]).map(
              ([k, v]) => {
                const on = selectedFrictions.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onToggleFriction(k)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: `1px solid ${on ? v.color : v.color + "40"}`,
                      background: on ? v.color : v.color + "15",
                      color: on ? "#fff" : v.color,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: on ? "#fff" : v.color,
                      }}
                    />
                    {v.label}
                  </button>
                );
              },
            )}
          </div>
          {selectedFrictions.length === 1 && (
            <p style={{ fontSize: 12, color: "#7A756B", marginBottom: 12 }}>
              {FRICTIONS[selectedFrictions[0]].description}
            </p>
          )}

          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#7A756B",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Care Qualities
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {(Object.entries(QUALITIES) as [CareQuality, (typeof QUALITIES)[CareQuality]][]).map(
              ([k, v]) => {
                const on = selectedQualities.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onToggleQuality(k)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: `1px solid ${on ? v.color : v.color + "40"}`,
                      background: on ? v.color : v.color + "15",
                      color: on ? "#fff" : v.color,
                    }}
                  >
                    {v.label}
                  </button>
                );
              },
            )}
          </div>

          {count > 0 && (
            <button
              type="button"
              onClick={onClear}
              style={{
                fontSize: 12,
                color: "#C45D3E",
                fontWeight: 500,
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StoryPanel({
  story,
  connections,
  allStories,
  onClose,
  onNavigate,
}: {
  story: PublicStory;
  connections: PublicConnection[];
  allStories: PublicStory[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const linked = connections
    .map((c) => {
      const otherId = c.from_story_id === story.id ? c.to_story_id : c.from_story_id;
      return { conn: c, other: allStories.find((s) => s.id === otherId) };
    })
    .filter((x) => x.other);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.2)", zIndex: 30 }}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100%",
          width: 420,
          maxWidth: "90vw",
          background: "#fff",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,.1)",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #E8E4DB",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: 99,
              background: "#EDE9E0",
              color: "#7A756B",
            }}
          >
            {SCALES[story.map_scale]?.label ?? story.map_scale}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#7A756B",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 14,
              fontFamily: "var(--font-source-serif)",
              lineHeight: 1.25,
              color: "#2C2A25",
            }}
          >
            {story.title}
          </h2>

          {story.frictions?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {story.frictions.map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: FRICTIONS[f]?.color + "20",
                    color: FRICTIONS[f]?.color,
                    fontWeight: 500,
                  }}
                >
                  {FRICTIONS[f]?.label}
                </span>
              ))}
            </div>
          )}
          {story.qualities?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18 }}>
              {story.qualities.map((q) => (
                <span
                  key={q}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: QUALITIES[q]?.color + "20",
                    color: QUALITIES[q]?.color,
                    fontWeight: 500,
                  }}
                >
                  {QUALITIES[q]?.label}
                </span>
              ))}
            </div>
          )}

          {story.body.split("\n\n").map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: 16,
                lineHeight: 1.75,
                marginBottom: 16,
                fontFamily: "var(--font-source-serif)",
                color: "#2C2A25",
              }}
            >
              {p}
            </p>
          ))}

          {story.author_credit && (
            <p style={{ fontSize: 12, color: "#A09A8E", marginTop: 24 }}>
              {story.author_credit}
              {story.field_site && <> &middot; {story.field_site}</>}
            </p>
          )}

          {linked.length > 0 && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #E8E4DB" }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#7A756B",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                Connected stories
              </p>
              {linked.map(({ conn, other }) => (
                <button
                  key={conn.id}
                  type="button"
                  onClick={() => onNavigate(other!.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    border: "1px solid #E8E4DB",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 11, color: FRICTIONS[conn.friction]?.color }}>
                    {FRICTIONS[conn.friction]?.label} ({conn.connection_type})
                  </span>
                  <br />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#2C2A25" }}>
                    {other!.title}
                  </span>
                  {conn.description && (
                    <p style={{ fontSize: 12, color: "#A09A8E", marginTop: 4 }}>
                      {conn.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
