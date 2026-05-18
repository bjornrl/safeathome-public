"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicStory, PublicConnection, CareFriction, CareQuality, MapScale } from "@/lib/types";
import { MAP_CONFIG, MAP_STYLE, FRICTIONS, QUALITIES, SCALES, DISTRICTS } from "@/lib/constants";
import { getMapStories, getConnections } from "@/lib/queries";
import Nav from "@/components/Nav";
const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const CLAY_CANVAS = "#fffaf0";
const CLAY_INK = "#0a0a0a";
const CLAY_BODY = "#3a3a3a";
const CLAY_MUTED = "#6a6a6a";
const CLAY_HAIRLINE = "#e5e0d0";
const CLAY_SURFACE_SOFT = "#faf5e8";

// ─── Helpers ───

function getScale(zoom: number): MapScale {
  if (zoom >= MAP_CONFIG.microToMesoZoom) return "micro";
  if (zoom >= MAP_CONFIG.mesoToMacroZoom) return "meso";
  return "macro";
}
function primaryFrictionColor(story: PublicStory): string {
  const first = story.frictions?.[0];
  return first ? FRICTIONS[first]?.color ?? CLAY_INK : CLAY_INK;
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
      pitch: 0
    });
    map.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), "top-right");
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
    const storyMap = new Map(stories.map(s => [s.id, s]));
    const features = connections.map(conn => {
      const from = storyMap.get(conn.from_story_id);
      const to = storyMap.get(conn.to_story_id);
      if (!from?.latitude || !from?.longitude || !to?.latitude || !to?.longitude) return null;
      return {
        type: "Feature" as const,
        properties: {
          friction: conn.friction,
          connection_type: conn.connection_type,
          color: FRICTIONS[conn.friction]?.color ?? "#999"
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]]
        }
      };
    }).filter(Boolean);
    if (map.getSource("connections")) {
      (map.getSource("connections") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: features as GeoJSON.Feature[]
      });
    } else {
      map.addSource("connections", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: features as GeoJSON.Feature[]
        }
      });
      // phase4: connection_type (direct/indirect) is only rendered visually
      // here — direct = solid line, indirect = dashed line-dasharray. It's
      // also surfaced as editable text in the admin form and as an inline
      // annotation in the story side-panel below. Nothing filters, groups,
      // or analyzes on this field elsewhere. If we keep it, a small map
      // legend explaining "dashed = mediated causation" would help readers.
      map.addLayer({
        id: "conn-solid",
        type: "line",
        source: "connections",
        filter: ["==", ["get", "connection_type"], "direct"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2.5,
          "line-opacity": 0.7
        },
        layout: {
          "line-cap": "round"
        }
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
          "line-dasharray": [4, 3]
        },
        layout: {
          "line-cap": "round"
        }
      });
    }
  }, [mapReady, stories, connections]);

  // ─── Add/update story markers ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const hasFilter = selectedFrictions.length > 0 || selectedQualities.length > 0;
    const filteredIds = hasFilter ? new Set(stories.filter(s => {
      const fMatch = selectedFrictions.length === 0 || selectedFrictions.some(f => s.frictions?.includes(f));
      const qMatch = selectedQualities.length === 0 || selectedQualities.some(q => s.qualities?.includes(q));
      return fMatch && qMatch;
    }).map(s => s.id)) : null;
    const visible = stories.filter(s => {
      if (!s.latitude || !s.longitude) return false;
      if (currentScale === "macro" && s.map_scale !== "macro") return false;
      if (currentScale === "meso" && s.map_scale === "micro") return false;
      return true;
    });
    visible.forEach(s => {
      const dimmed = filteredIds !== null && !filteredIds.has(s.id);
      const color = primaryFrictionColor(s);
      const el = document.createElement("div");
      el.style.cssText = "cursor:pointer;";
      const circle = document.createElement("div");
      circle.style.cssText = `width:26px;height:26px;border-radius:50%;background:${dimmed ? "#cccccc" : color};border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,.25);opacity:${dimmed ? 0.4 : 1};transition:transform .15s;display:flex;align-items:center;justify-content:center;`;
      const dot = document.createElement("div");
      dot.style.cssText = "width:7px;height:7px;border-radius:50%;background:#ffffff;";
      circle.appendChild(dot);
      el.appendChild(circle);
      el.onmouseenter = () => {
        circle.style.transform = "scale(1.25)";
      };
      el.onmouseleave = () => {
        circle.style.transform = "scale(1)";
      };
      el.onclick = e => {
        e.stopPropagation();
        setSelectedStory(s);
      };
      const marker = new maplibregl.Marker({
        element: el
      }).setLngLat([s.longitude!, s.latitude!]).addTo(map);
      markersRef.current.push(marker);
    });
  }, [mapReady, stories, currentScale, selectedFrictions, selectedQualities]);

  // ─── Connection line filter highlight ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("conn-solid")) return;
    if (selectedFrictions.length > 0) {
      const expr: maplibregl.ExpressionSpecification = ["case", ["in", ["get", "friction"], ["literal", selectedFrictions]], 0.9, 0.1];
      map.setPaintProperty("conn-solid", "line-opacity", expr);
      map.setPaintProperty("conn-dashed", "line-opacity", expr);
      map.setPaintProperty("conn-solid", "line-width", ["case", ["in", ["get", "friction"], ["literal", selectedFrictions]], 4, 1]);
    } else {
      map.setPaintProperty("conn-solid", "line-opacity", 0.7);
      map.setPaintProperty("conn-dashed", "line-opacity", 0.5);
      map.setPaintProperty("conn-solid", "line-width", 2.5);
    }
  }, [mapReady, selectedFrictions]);

  // ─── Actions ───
  const flyTo = useCallback((center: [number, number], z: number) => {
    mapRef.current?.flyTo({
      center,
      zoom: z,
      duration: 1800
    });
  }, []);
  const openStory = useCallback((id: string) => {
    const s = stories.find(x => x.id === id);
    if (!s) return;
    setSelectedStory(s);
    if (s.latitude && s.longitude) {
      flyTo([s.longitude, s.latitude], s.map_scale === "micro" ? 18 : s.map_scale === "meso" ? 15 : 12);
    }
  }, [stories, flyTo]);
  const toggleFriction = useCallback((f: CareFriction) => {
    setSelectedFrictions(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  }, []);
  const toggleQuality = useCallback((q: CareQuality) => {
    setSelectedQualities(p => p.includes(q) ? p.filter(x => x !== q) : [...p, q]);
  }, []);
  const zoomToScale = useCallback((s: MapScale) => {
    const target = s === "micro" ? 18 : s === "meso" ? 15 : 11;
    mapRef.current?.easeTo({ zoom: target, duration: 1200 });
  }, []);
  const relatedConnections = selectedStory ? connections.filter(c => c.from_story_id === selectedStory.id || c.to_story_id === selectedStory.id) : [];
  return <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <Nav variant="minimal" />

      {/* Map canvas */}
      <div ref={containerRef} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />

      {/* ─── House view overlay (replaces map at micro scale) ─── */}
      <AnimatePresence>
        {currentScale === "micro" && (
          <motion.div
            key="house-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 10,
              background: "#EDE9E0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px 24px 24px",
              pointerEvents: "none",
            }}
          >
            <img
              src="/images/Revidert_plantegning.png"
              alt="Revidert plantegning — floor plan of the home"
              style={{
                maxWidth: "min(1200px, 95%)",
                maxHeight: "90%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── District selector (top-right, below nav control) ─── */}
      <div className="[position:absolute] [top:64px] [right:16px] [z-index:20]">
        <select onChange={e => {
        const d = DISTRICTS[e.target.value];
        if (d) flyTo(d.center, d.zoom);
      }} defaultValue="" style={{
        fontFamily: FONT_STACK,
        padding: "10px 16px",
        borderRadius: "12px",
        border: `1px solid ${CLAY_HAIRLINE}`,
        background: CLAY_CANVAS,
        fontSize: "13px",
        fontWeight: 500,
        color: CLAY_INK,
        cursor: "pointer",
      }}>
          <option value="" disabled>
            Jump to district
          </option>
          {Object.entries(DISTRICTS).map(([k, d]) => <option key={k} value={k}>
              {d.label}
            </option>)}
        </select>
      </div>

      {/* ─── Filter panel (top-left, offset for nav) ─── */}
      <FilterPanel selectedFrictions={selectedFrictions} selectedQualities={selectedQualities} onToggleFriction={toggleFriction} onToggleQuality={toggleQuality} onClear={() => {
      setSelectedFrictions([]);
      setSelectedQualities([]);
    }} />

      {/* ─── Zoom indicator / scale jumper (bottom-left) ─── */}
      <div style={{
      fontFamily: FONT_STACK,
      background: CLAY_CANVAS,
      border: `1px solid ${CLAY_HAIRLINE}`,
      borderRadius: "12px",
    }} className="[position:absolute] [bottom:32px] [left:16px] [z-index:20] [padding:8px] [display:flex] [flex-direction:column] [gap:2px]">
        {(["macro", "meso", "micro"] as MapScale[]).map(s => {
          const active = currentScale === s;
          return <button key={s} type="button" onClick={() => zoomToScale(s)} style={{
            fontFamily: FONT_STACK,
            background: active ? CLAY_SURFACE_SOFT : "transparent",
            cursor: "pointer",
            borderRadius: "8px",
          }} className="[display:flex] [align-items:center] [gap:8px] [padding:6px_12px] [border:none] [text-align:left] [transition:background_.15s]">
              <span style={{
                background: active ? CLAY_INK : CLAY_HAIRLINE
              }} className="[width:8px] [height:8px] [border-radius:50%] [flex-shrink:0]" />
              <span style={{
                fontWeight: active ? 600 : 500,
                color: active ? CLAY_INK : CLAY_MUTED
              }} className="[font-size:12px]">
                {SCALES[s].label}
              </span>
            </button>;
        })}
      </div>

      {/* ─── Story panel ─── */}
      <AnimatePresence>
        {selectedStory && <StoryPanel story={selectedStory} connections={relatedConnections} allStories={stories} onClose={() => setSelectedStory(null)} onNavigate={openStory} />}
      </AnimatePresence>
    </div>;
}

// ─── Sub-components ───

function FilterPanel({
  selectedFrictions,
  selectedQualities,
  onToggleFriction,
  onToggleQuality,
  onClear
}: {
  selectedFrictions: CareFriction[];
  selectedQualities: CareQuality[];
  onToggleFriction: (f: CareFriction) => void;
  onToggleQuality: (q: CareQuality) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const count = selectedFrictions.length + selectedQualities.length;
  return <div style={{
    fontFamily: FONT_STACK
  }} className="[position:absolute] [top:64px] [left:16px] [z-index:20] [max-width:320px]">
      <button type="button" onClick={() => setOpen(!open)} style={{
        background: CLAY_CANVAS,
        border: `1px solid ${CLAY_HAIRLINE}`,
        borderRadius: "12px",
        color: CLAY_INK,
        cursor: "pointer",
      }} className="[display:flex] [align-items:center] [gap:8px] [padding:10px_16px] [font-size:13px] [font-weight:600]">
        Filters
        {count > 0 && <span style={{ background: CLAY_INK, color: CLAY_CANVAS }} className="[width:20px] [height:20px] [border-radius:50%] [font-size:11px] [display:flex] [align-items:center] [justify-content:center] [font-weight:600]">
            {count}
          </span>}
      </button>

      {open && <div style={{
        background: CLAY_CANVAS,
        border: `1px solid ${CLAY_HAIRLINE}`,
        borderRadius: "16px",
      }} className="[margin-top:8px] [padding:20px] [max-height:70vh] [overflow-y:auto]">
          <p style={{
            color: CLAY_MUTED,
            letterSpacing: "1.5px",
          }} className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [margin-bottom:10px]">
            Care Frictions
          </p>
          <div className="[display:flex] [flex-wrap:wrap] [gap:8px] [margin-bottom:16px]">
            {(Object.entries(FRICTIONS) as [CareFriction, (typeof FRICTIONS)[CareFriction]][]).map(([k, v]) => {
          const on = selectedFrictions.includes(k);
          return <button key={k} type="button" onClick={() => onToggleFriction(k)} style={{
            border: `1px solid ${on ? v.color : v.color + "40"}`,
            background: on ? v.color : v.color + "15",
            color: on ? "#ffffff" : v.color
          }} className="[display:flex] [align-items:center] [gap:6px] [padding:4px_10px] [border-radius:4px] [font-size:12px] [font-weight:500] [cursor:pointer]">
                    <span style={{
              background: on ? "#ffffff" : v.color
            }} className="[width:7px] [height:7px] [border-radius:50%]" />
                    {v.label}
                  </button>;
        })}
          </div>
          {selectedFrictions.length === 1 && <p style={{ color: CLAY_MUTED }} className="[font-size:12px] [margin-bottom:16px] [line-height:1.5]">
              {FRICTIONS[selectedFrictions[0]].description}
            </p>}

          <p style={{
            color: CLAY_MUTED,
            letterSpacing: "1.5px",
          }} className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [margin-bottom:10px]">
            Care Qualities
          </p>
          <div className="[display:flex] [flex-wrap:wrap] [gap:8px] [margin-bottom:16px]">
            {(Object.entries(QUALITIES) as [CareQuality, (typeof QUALITIES)[CareQuality]][]).map(([k, v]) => {
          const on = selectedQualities.includes(k);
          return <button key={k} type="button" onClick={() => onToggleQuality(k)} style={{
            border: `1px solid ${on ? v.color : v.color + "40"}`,
            background: on ? v.color : v.color + "15",
            color: on ? "#ffffff" : v.color
          }} className="[padding:4px_10px] [border-radius:4px] [font-size:12px] [font-weight:500] [cursor:pointer]">
                    {v.label}
                  </button>;
        })}
          </div>

          {count > 0 && <button type="button" onClick={onClear} style={{ color: CLAY_INK }} className="[font-size:12px] [font-weight:600] [cursor:pointer] [background:none] [border:none] [padding:0px] [text-decoration:underline] [text-underline-offset:4px]">
              Clear all filters
            </button>}
        </div>}
    </div>;
}
function StoryPanel({
  story,
  connections,
  allStories,
  onClose,
  onNavigate
}: {
  story: PublicStory;
  connections: PublicConnection[];
  allStories: PublicStory[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const linked = connections.map(c => {
    const otherId = c.from_story_id === story.id ? c.to_story_id : c.from_story_id;
    return {
      conn: c,
      other: allStories.find(s => s.id === otherId)
    };
  }).filter(x => x.other);
  return <>
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} onClick={onClose} className="[position:fixed] [inset:0px] [background:rgba(10,10,10,.18)] [z-index:30]" />
      <motion.div initial={{
      x: "100%"
    }} animate={{
      x: 0
    }} exit={{
      x: "100%"
    }} transition={{
      type: "spring",
      damping: 30,
      stiffness: 300
    }} style={{
      fontFamily: FONT_STACK,
      background: CLAY_CANVAS,
      borderLeft: `1px solid ${CLAY_HAIRLINE}`,
    }} className="[position:fixed] [right:0px] [top:0px] [height:100%] [width:480px] [max-width:90vw] [z-index:40] [display:flex] [flex-direction:column]">
        <div style={{ borderBottom: `1px solid ${CLAY_HAIRLINE}` }} className="[display:flex] [align-items:center] [justify-content:space-between] [padding:20px_28px]">
          <span style={{
            background: CLAY_SURFACE_SOFT,
            color: CLAY_MUTED,
            letterSpacing: "1.5px",
            borderRadius: "9999px",
          }} className="[font-size:11px] [font-weight:600] [padding:4px_12px] [text-transform:uppercase]">
            {SCALES[story.map_scale]?.label ?? story.map_scale}
          </span>
          <button type="button" onClick={onClose} style={{ color: CLAY_MUTED }} className="[background:none] [border:none] [font-size:28px] [cursor:pointer] [line-height:1]">
            &times;
          </button>
        </div>

        <div className="[flex:1px] [overflow-y:auto] [padding:28px]">
          <h2 style={{
            fontSize: "32px",
            fontWeight: 500,
            color: CLAY_INK,
            letterSpacing: "-0.8px",
            lineHeight: 1.1,
          }} className="[margin-bottom:20px]">
            {story.title}
          </h2>

          {story.frictions?.length > 0 && <div className="[display:flex] [flex-wrap:wrap] [gap:6px] [margin-bottom:8px]">
              {story.frictions.map(f => <span key={f} style={{
            background: FRICTIONS[f]?.color + "20",
            color: FRICTIONS[f]?.color
          }} className="[font-size:11px] [padding:3px_10px] [border-radius:4px] [font-weight:500]">
                  {FRICTIONS[f]?.label}
                </span>)}
            </div>}
          {story.qualities?.length > 0 && <div className="[display:flex] [flex-wrap:wrap] [gap:6px] [margin-bottom:24px]">
              {story.qualities.map(q => <span key={q} style={{
            background: QUALITIES[q]?.color + "20",
            color: QUALITIES[q]?.color
          }} className="[font-size:11px] [padding:3px_10px] [border-radius:4px] [font-weight:500]">
                  {QUALITIES[q]?.label}
                </span>)}
            </div>}

          {story.body.split("\n\n").map((p, i) => <p key={i} style={{ color: CLAY_BODY }} className="[font-size:16px] [line-height:1.65] [margin-bottom:16px]">
              {p}
            </p>)}

          {story.author_credit && <p style={{ color: CLAY_MUTED }} className="[font-size:12px] [margin-top:24px]">
              {story.author_credit}
              {story.field_site && <> &middot; {story.field_site}</>}
            </p>}

          {linked.length > 0 && <div style={{ borderTop: `1px solid ${CLAY_HAIRLINE}` }} className="[margin-top:32px] [padding-top:24px]">
              <p style={{
                color: CLAY_MUTED,
                letterSpacing: "1.5px",
              }} className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [margin-bottom:16px]">
                Connected stories
              </p>
              {linked.map(({
            conn,
            other
          }) => <button key={conn.id} type="button" onClick={() => onNavigate(other!.id)} style={{
            fontFamily: FONT_STACK,
            background: CLAY_SURFACE_SOFT,
            border: `1px solid ${CLAY_HAIRLINE}`,
            borderRadius: "12px",
            cursor: "pointer",
          }} className="[display:block] [width:100%] [text-align:left] [padding:16px] [margin-bottom:8px]">
                  <span style={{
              color: FRICTIONS[conn.friction]?.color
            }} className="[font-size:11px] [font-weight:600] [letter-spacing:1px] [text-transform:uppercase]">
                    {FRICTIONS[conn.friction]?.label} ({conn.connection_type})
                  </span>
                  <br />
                  <span style={{ color: CLAY_INK }} className="[font-size:15px] [font-weight:600]">
                    {other!.title}
                  </span>
                  {conn.description && <p style={{ color: CLAY_MUTED }} className="[font-size:12px] [margin-top:4px] [line-height:1.5]">
                      {conn.description}
                    </p>}
                </button>)}
            </div>}
        </div>
      </motion.div>
    </>;
}
