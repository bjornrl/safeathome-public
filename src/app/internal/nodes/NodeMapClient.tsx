"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import type {
  CareFriction,
  CareQuality,
  FieldSite,
  HouseTheme,
  Insight,
  QuickNote,
  WorkPackage,
} from "@/lib/types";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

const INSIGHT_COLOR = "#C45D3E";
const NOTE_COLOR = "#5B6AAF";
const NEUTRAL_EDGE = "#A09A8E";
// Manual links the editor created via "Koble til andre" in the note editor.
// Rendered thicker + fully opaque so they stand out from the weaker
// auto-derived shared-category edges.
const MANUAL_EDGE = "#2a2859";

type NodeKind = "quick_note" | "insight";

interface GraphNode {
  id: string;
  kind: NodeKind;
  title: string;
  body: string;
  frictions: CareFriction[];
  qualities: CareQuality[];
  workPackage: WorkPackage | null;
  fieldSite: FieldSite | null;
  houseThemes: HouseTheme[];
  degree: number;
  raw: QuickNote | Insight;
}

type EdgeCategory =
  | { kind: "friction"; key: CareFriction }
  | { kind: "quality"; key: CareQuality }
  | { kind: "work_package"; key: WorkPackage }
  | { kind: "field_site"; key: FieldSite }
  | { kind: "house_theme"; key: HouseTheme }
  | { kind: "manual"; key: "manual" };

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  category: EdgeCategory;
}

// ─── Layout: seeded RNG + Poisson-disk scatter ───
// Stable across renders so the constellation doesn't reshuffle every time the
// graph re-mounts. Lifted from the project-cluster recipe in
// .claude/node_cluster.md.

function seededRandom(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCATTER_SEED = "safeathome-node-graph";
const MAX_DEGREE = 4;

function poissonScatter(
  count: number,
  width: number,
  height: number,
  pad: { x: number; top: number; bottom: number },
  seed: string,
): { x: number; y: number }[] {
  if (count === 0 || width <= 0 || height <= 0) return [];
  const rand = seededRandom(seed);
  const usableW = Math.max(1, width - pad.x * 2);
  const usableH = Math.max(1, height - pad.top - pad.bottom);
  const area = usableW * usableH;
  const minDist = Math.sqrt(area / count) * 0.65;
  const minDistSq = minDist * minDist;
  const MAX_ATTEMPTS = 200;
  const placed: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let candidate = { x: 0, y: 0 };
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      candidate = {
        x: pad.x + rand() * usableW,
        y: pad.top + rand() * usableH,
      };
      let ok = true;
      for (const p of placed) {
        const dx = p.x - candidate.x;
        const dy = p.y - candidate.y;
        if (dx * dx + dy * dy < minDistSq) {
          ok = false;
          break;
        }
      }
      if (ok) break;
    }
    placed.push(candidate);
  }
  return placed;
}

// ─── Drift + snap animation constants ───
const DRIFT_AMP = 6; // px peak drift on each axis
const SNAP_RADIUS = 110; // px — only one dot at a time can be "grabbed"
const SNAP_RAMP = 0.35; // per-frame easing toward snap factor target

interface AnimState {
  px: number; // phase x
  py: number; // phase y
  fx: number; // freq x (Hz)
  fy: number; // freq y (Hz)
  snapFactor: number; // 0 = pure drift, 1 = locked to cursor
}

function makeAnimState(id: string): AnimState {
  const rand = seededRandom(`drift:${id}`);
  return {
    px: rand() * Math.PI * 2,
    py: rand() * Math.PI * 2,
    fx: 0.07 + rand() * 0.06,
    fy: 0.07 + rand() * 0.06,
    snapFactor: 0,
  };
}

interface FilterState {
  type: "all" | "insights" | "notes";
  frictions: Set<CareFriction>;
  qualities: Set<CareQuality>;
  workPackages: Set<WorkPackage>;
}

const EMPTY_FILTERS: FilterState = {
  type: "all",
  frictions: new Set(),
  qualities: new Set(),
  workPackages: new Set(),
};

const WP_OPTIONS: WorkPackage[] = ["WP1", "WP2", "WP3", "WP4"];
const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];

function dedupe<T>(arr: (T | null | undefined)[]): T[] {
  const seen = new Set<T>();
  for (const v of arr) {
    if (v == null) continue;
    seen.add(v);
  }
  return Array.from(seen);
}

function noteToNode(n: QuickNote): GraphNode {
  return {
    id: `note:${n.id}`,
    kind: "quick_note",
    title: (n.headline?.trim() || (n.body ? n.body.slice(0, 60) : "(uten tittel)")).trim(),
    body: n.body ?? "",
    frictions: n.care_frictions ?? [],
    qualities: n.care_qualities ?? [],
    workPackage: n.work_package,
    fieldSite: n.field_site,
    houseThemes: n.house_themes ?? [],
    degree: 0,
    raw: n,
  };
}

function insightToNode(i: Insight): GraphNode {
  return {
    id: `insight:${i.id}`,
    kind: "insight",
    title: i.title,
    body: i.body ?? "",
    frictions: [],
    qualities: [],
    workPackage: i.work_package,
    fieldSite: i.field_site,
    houseThemes: [],
    degree: 0,
    raw: i,
  };
}

function findShared(a: GraphNode, b: GraphNode): EdgeCategory | null {
  for (const f of a.frictions) if (b.frictions.includes(f)) return { kind: "friction", key: f };
  for (const q of a.qualities) if (b.qualities.includes(q)) return { kind: "quality", key: q };
  if (a.workPackage && a.workPackage === b.workPackage) {
    return { kind: "work_package", key: a.workPackage };
  }
  if (a.fieldSite && a.fieldSite === b.fieldSite) {
    return { kind: "field_site", key: a.fieldSite };
  }
  for (const t of a.houseThemes) if (b.houseThemes.includes(t)) return { kind: "house_theme", key: t };
  return null;
}

function edgeColor(category: EdgeCategory): string {
  if (category.kind === "friction") return FRICTIONS[category.key].color;
  if (category.kind === "quality") return QUALITIES[category.key].color;
  if (category.kind === "manual") return MANUAL_EDGE;
  return NEUTRAL_EDGE;
}

function edgeLabel(category: EdgeCategory): string {
  if (category.kind === "friction") return FRICTIONS[category.key].label;
  if (category.kind === "quality") return QUALITIES[category.key].label;
  if (category.kind === "work_package") return category.key;
  if (category.kind === "field_site") return category.key;
  if (category.kind === "manual") return "Manuell kobling";
  return category.key.replace(/_/g, " ");
}

export default function NodeMapClient() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  // Refs to each node group + each edge line so the rAF loop can update
  // transforms / endpoints without a React re-render per frame.
  const nodeElsRef = useRef<Map<string, SVGGElement>>(new Map());
  const lineElsRef = useRef<Map<string, { el: SVGLineElement; source: string; target: string }>>(new Map());
  // Per-node drift state (phase + frequency + snap factor).
  const animStateRef = useRef<Map<string, AnimState>>(new Map());
  // Native pointer coords, relative to the canvas. Parked off-screen until
  // the cursor enters so nothing is snapped on first render.
  const mouseRef = useRef({ x: -10000, y: -10000 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Resize canvas to container ──
  useEffect(() => {
    function update() {
      const el = canvasRef.current;
      if (!el) return;
      setSize({ width: el.clientWidth, height: el.clientHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [sidebarOpen]);

  // ── Load nodes + build edges ──
  useEffect(() => {
    let active = true;
    (async () => {
      const [notesRes, insightsRes, connRes] = await Promise.all([
        supabase.from("quick_notes").select("*"),
        supabase.from("insights").select("*"),
        // Manual links the editor created via "Koble til andre" in the note
        // editor. Surface them as strong edges that don't get dimmed by the
        // category filters.
        supabase
          .from("note_connections")
          .select("from_note_id, from_insight_id, to_note_id, to_insight_id"),
      ]);
      if (!active) return;
      if (notesRes.error || insightsRes.error) {
        setError(notesRes.error?.message ?? insightsRes.error?.message ?? "Klarte ikke å hente data.");
        setLoading(false);
        return;
      }
      const noteNodes = ((notesRes.data as QuickNote[] | null) ?? []).map(noteToNode);
      const insightNodes = ((insightsRes.data as Insight[] | null) ?? []).map(insightToNode);
      const all = [...noteNodes, ...insightNodes];
      const byId = new Map(all.map((n) => [n.id, n] as const));

      const builtEdges: GraphEdge[] = [];
      const degree: Record<string, number> = {};

      // 1) Manual links first — these take precedence over auto-derived edges
      //    between the same two nodes (we de-dupe below).
      const manualPairs = new Set<string>();
      type ConnRow = {
        from_note_id: string | null;
        from_insight_id: string | null;
        to_note_id: string | null;
        to_insight_id: string | null;
      };
      const rawConns = ((connRes.data as ConnRow[] | null) ?? []).filter(
        () => !connRes.error,
      );
      if (connRes.error) {
        console.warn("[NodeMap] note_connections failed:", connRes.error.message);
      }
      for (const c of rawConns) {
        const sourceId = c.from_note_id
          ? `note:${c.from_note_id}`
          : c.from_insight_id
            ? `insight:${c.from_insight_id}`
            : null;
        const targetId = c.to_note_id
          ? `note:${c.to_note_id}`
          : c.to_insight_id
            ? `insight:${c.to_insight_id}`
            : null;
        if (!sourceId || !targetId || sourceId === targetId) continue;
        if (!byId.has(sourceId) || !byId.has(targetId)) continue;
        // Normalise the pair key so A→B and B→A collapse.
        const pairKey = [sourceId, targetId].sort().join("|");
        if (manualPairs.has(pairKey)) continue;
        manualPairs.add(pairKey);
        builtEdges.push({
          id: `${pairKey}--manual`,
          source: sourceId,
          target: targetId,
          category: { kind: "manual", key: "manual" },
        });
        degree[sourceId] = (degree[sourceId] ?? 0) + 1;
        degree[targetId] = (degree[targetId] ?? 0) + 1;
      }

      // 2) Auto-derived shared-category edges, skipping any pair that already
      //    has a manual link.
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const pairKey = [all[i].id, all[j].id].sort().join("|");
          if (manualPairs.has(pairKey)) continue;
          const cat = findShared(all[i], all[j]);
          if (!cat) continue;
          builtEdges.push({
            id: `${all[i].id}--${all[j].id}--${cat.kind}:${cat.key}`,
            source: all[i].id,
            target: all[j].id,
            category: cat,
          });
          degree[all[i].id] = (degree[all[i].id] ?? 0) + 1;
          degree[all[j].id] = (degree[all[j].id] ?? 0) + 1;
        }
      }
      for (const n of all) n.degree = degree[n.id] ?? 0;
      setNodes(all);
      setEdges(builtEdges);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // ── Filter visibility ──
  const visibleNodeIds = useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      if (filters.type === "insights" && n.kind !== "insight") continue;
      if (filters.type === "notes" && n.kind !== "quick_note") continue;
      if (filters.frictions.size > 0 && !n.frictions.some((f) => filters.frictions.has(f))) continue;
      if (filters.qualities.size > 0 && !n.qualities.some((q) => filters.qualities.has(q))) continue;
      if (filters.workPackages.size > 0 && (!n.workPackage || !filters.workPackages.has(n.workPackage))) continue;
      set.add(n.id);
    }
    return set;
  }, [nodes, filters]);

  const visibleEdges = useMemo(() => {
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  const searchHits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      nodes
        .filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
        .map((n) => n.id),
    );
  }, [nodes, search]);

  // ── Stable Poisson-disk scatter of anchor positions ──
  // Recomputed only when the node set or canvas size changes; the seed keeps
  // the constellation stable across renders so it doesn't reshuffle on every
  // mount or filter toggle.
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    if (nodes.length === 0 || size.width <= 0 || size.height <= 0) return map;
    const padX = 64;
    const padTop = 32;
    const padBottom = 32;
    const scattered = poissonScatter(
      nodes.length,
      size.width,
      size.height,
      { x: padX, top: padTop, bottom: padBottom },
      `${SCATTER_SEED}:${nodes.length}`,
    );
    nodes.forEach((n, i) => map.set(n.id, scattered[i]));
    return map;
  }, [nodes, size.width, size.height]);

  // ── Anim state seeded per node id ──
  useEffect(() => {
    const next = new Map<string, AnimState>();
    for (const n of nodes) {
      next.set(n.id, animStateRef.current.get(n.id) ?? makeAnimState(n.id));
    }
    animStateRef.current = next;
  }, [nodes]);

  // ── Pointer tracking (native events, ref-only — no re-renders) ──
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    function onMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }
    function onLeave() {
      mouseRef.current.x = -10000;
      mouseRef.current.y = -10000;
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // ── rAF drift + cursor-snap loop ──
  // Per-frame: pick the single nearest dot inside SNAP_RADIUS, ramp its snap
  // factor toward 1, ramp every other dot's toward 0. Drift is a sine wave
  // per axis that fades out when snapped. All position writes are direct
  // setAttribute calls so React never re-renders for animation.
  useEffect(() => {
    if (positions.size === 0) return;
    let raf = 0;
    let lastHoverEmitted: string | null = null;
    const start = performance.now();
    function tick(now: number) {
      const t = (now - start) / 1000;
      const mouse = mouseRef.current;
      // 1) Find the single closest dot within SNAP_RADIUS.
      let nearestId: string | null = null;
      let nearestDistSq = SNAP_RADIUS * SNAP_RADIUS;
      positions.forEach((p, id) => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < nearestDistSq) {
          nearestDistSq = d2;
          nearestId = id;
        }
      });

      // 2) Update each dot's transform.
      const offsets = new Map<string, { x: number; y: number }>();
      positions.forEach((p, id) => {
        const state = animStateRef.current.get(id);
        if (!state) return;
        const target = id === nearestId ? 1 : 0;
        state.snapFactor += (target - state.snapFactor) * SNAP_RAMP;
        const drift = 1 - state.snapFactor;
        const dx = Math.sin(2 * Math.PI * state.fx * t + state.px) * DRIFT_AMP * drift;
        const dy = Math.cos(2 * Math.PI * state.fy * t + state.py) * DRIFT_AMP * drift;
        const snapX = (mouse.x - p.x) * state.snapFactor;
        const snapY = (mouse.y - p.y) * state.snapFactor;
        const x = p.x + dx + snapX;
        const y = p.y + dy + snapY;
        offsets.set(id, { x, y });
        const el = nodeElsRef.current.get(id);
        if (el) el.setAttribute("transform", `translate(${x}, ${y})`);
      });

      // 3) Update each line's endpoints.
      lineElsRef.current.forEach(({ el, source, target }) => {
        const s = offsets.get(source);
        const e2 = offsets.get(target);
        if (!s || !e2) return;
        el.setAttribute("x1", String(s.x));
        el.setAttribute("y1", String(s.y));
        el.setAttribute("x2", String(e2.x));
        el.setAttribute("y2", String(e2.y));
      });

      // 4) Emit hover state to React only on transitions.
      if (nearestId !== lastHoverEmitted) {
        lastHoverEmitted = nearestId;
        setHoveredId(nearestId);
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [positions]);

  function radiusFor(n: GraphNode): number {
    return Math.max(8, Math.min(16, 8 + n.degree * 0.8));
  }

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) ?? null : null;

  return (
    <main
      style={{
        fontFamily: FONT_STACK,
        background: colors.bg,
        position: "relative",
        height: "calc(100vh - 120px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: sidebarOpen ? "420px 1fr" : "0 1fr",
          transition: "grid-template-columns 0.2s ease",
        }}
      >
        <FilterSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          filters={filters}
          setFilters={setFilters}
          search={search}
          setSearch={setSearch}
          totalNodes={nodes.length}
          visibleNodes={visibleNodeIds.size}
          edgesCount={visibleEdges.length}
          listNodes={nodes.filter((n) => visibleNodeIds.has(n.id))}
          searchHits={searchHits}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div
          ref={canvasRef}
          style={{ position: "relative", overflow: "hidden", background: colors.bgSubtle }}
        >
          {loading && (
            <p
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.textMuted,
                ...typography.sizes.t14,
              }}
            >
              Laster nodegraf…
            </p>
          )}
          {error && (
            <p
              style={{
                position: "absolute",
                top: space.s24,
                left: space.s24,
                color: "#a83f34",
                background: "#fff2f1",
                border: "1px solid #ffdfdc",
                padding: space.s12,
                ...typography.sizes.t14,
              }}
            >
              {error}
            </p>
          )}
          <svg
            ref={svgRef}
            width={size.width}
            height={size.height}
            style={{ display: "block" }}
            role="img"
            aria-label="Konstellasjonsgraf over hurtignotater og innsikter"
          >
            <g>
              {visibleEdges.map((e) => {
                const sNode = nodes.find((n) => n.id === e.source);
                const tNode = nodes.find((n) => n.id === e.target);
                if (!sNode || !tNode) return null;
                const sPos = positions.get(e.source);
                const tPos = positions.get(e.target);
                if (!sPos || !tPos) return null;
                const isHighlighted = hoveredId === e.source || hoveredId === e.target;
                const isManual = e.category.kind === "manual";
                const strokeOpacity = isManual ? (isHighlighted ? 1 : 0.85) : isHighlighted ? 0.9 : 0.4;
                const strokeWidth = isManual ? (isHighlighted ? 3.5 : 2.5) : isHighlighted ? 2 : 1;
                return (
                  <line
                    key={e.id}
                    ref={(el) => {
                      if (el) lineElsRef.current.set(e.id, { el, source: e.source, target: e.target });
                      else lineElsRef.current.delete(e.id);
                    }}
                    x1={sPos.x}
                    y1={sPos.y}
                    x2={tPos.x}
                    y2={tPos.y}
                    stroke={edgeColor(e.category)}
                    strokeOpacity={strokeOpacity}
                    strokeWidth={strokeWidth}
                  >
                    <title>
                      {isManual
                        ? "Manuell kobling (laget i notatredigereren)"
                        : edgeLabel(e.category)}
                    </title>
                  </line>
                );
              })}
              {nodes
                .filter((n) => visibleNodeIds.has(n.id))
                .map((n) => {
                  const dim = searchHits ? !searchHits.has(n.id) : false;
                  const r = radiusFor(n);
                  const fill = n.kind === "insight" ? INSIGHT_COLOR : NOTE_COLOR;
                  const pos = positions.get(n.id);
                  if (!pos) return null;
                  return (
                    <g
                      key={n.id}
                      className="node"
                      ref={(el) => {
                        if (el) nodeElsRef.current.set(n.id, el);
                        else nodeElsRef.current.delete(n.id);
                      }}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedId(n.id)}
                      style={{ cursor: "pointer", opacity: dim ? 0.2 : 1 }}
                    >
                      <circle
                        r={r}
                        fill={fill}
                        stroke={hoveredId === n.id || selectedId === n.id ? colors.brandDarkBlue : "white"}
                        strokeWidth={hoveredId === n.id || selectedId === n.id ? 3 : 1.5}
                      />
                      {(hoveredId === n.id || (searchHits && searchHits.has(n.id))) && (
                        <text
                          x={r + 6}
                          y={4}
                          fontSize={12}
                          fontFamily={FONT_STACK}
                          fill={colors.textBody}
                          style={{ pointerEvents: "none" }}
                        >
                          {n.title.length > 40 ? `${n.title.slice(0, 40)}…` : n.title}
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>
          </svg>

          {/* Hover tooltip */}
          {hoveredId && !selectedId && (
            <HoverTooltip node={nodes.find((n) => n.id === hoveredId) ?? null} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <DetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function HoverTooltip({ node }: { node: GraphNode | null }) {
  if (!node) return null;
  const tagCount =
    node.frictions.length +
    node.qualities.length +
    (node.workPackage ? 1 : 0) +
    (node.fieldSite ? 1 : 0) +
    node.houseThemes.length;
  return (
    <div
      style={{
        position: "absolute",
        left: space.s24,
        bottom: space.s24,
        padding: space.s12,
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        maxWidth: 360,
        pointerEvents: "none",
      }}
    >
      <p
        style={{
          ...typography.sizes.t12,
          fontWeight: typography.weights.bold,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: node.kind === "insight" ? INSIGHT_COLOR : NOTE_COLOR,
        }}
      >
        {node.kind === "insight" ? "Innsikt" : "Hurtignotat"}
      </p>
      <p
        style={{
          ...typography.sizes.t14,
          fontWeight: typography.weights.medium,
          color: colors.textBody,
          marginTop: 2,
        }}
      >
        {node.title}
      </p>
      <p style={{ ...typography.sizes.t12, color: colors.textMuted, marginTop: 4 }}>
        {tagCount} {tagCount === 1 ? "tagg" : "tagger"} · {node.degree} {node.degree === 1 ? "kobling" : "koblinger"}
      </p>
    </div>
  );
}

function DetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  // Internal Nav (utility row + main row) is roughly 100px tall and sticks at
  // the top with z-index 50. Push the panel + overlay below it so the panel
  // header isn't hidden behind the nav.
  const NAV_OFFSET = 120;
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          top: NAV_OFFSET,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(42, 40, 89, 0.2)",
          zIndex: 30,
        }}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{
          position: "fixed",
          top: NAV_OFFSET,
          right: 0,
          height: `calc(100vh - ${NAV_OFFSET}px)`,
          width: 480,
          maxWidth: "90vw",
          background: colors.bgCard,
          borderLeft: `1px solid ${colors.borderSubtle}`,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT_STACK,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${space.s16} ${space.s24}`,
            borderBottom: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <span
            style={{
              ...typography.sizes.t12,
              padding: `2px ${space.s8}`,
              background: node.kind === "insight" ? `${INSIGHT_COLOR}22` : `${NOTE_COLOR}22`,
              color: node.kind === "insight" ? INSIGHT_COLOR : NOTE_COLOR,
              fontWeight: typography.weights.bold,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderRadius: 4,
            }}
          >
            {node.kind === "insight" ? "Innsikt" : "Hurtignotat"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: colors.textMuted,
              lineHeight: 1,
              fontFamily: FONT_STACK,
            }}
          >
            ×
          </button>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: space.s24 }}>
          <h2
            style={{
              ...typography.sizes.t26,
              fontWeight: typography.weights.bold,
              color: colors.textBody,
              letterSpacing: "-0.01em",
              marginBottom: space.s16,
            }}
          >
            {node.title}
          </h2>
          {(node.frictions.length > 0 || node.qualities.length > 0 || node.workPackage || node.fieldSite || node.houseThemes.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4, marginBottom: space.s24 }}>
              {node.workPackage && (
                <Tag color={colors.brandDarkBlue}>{node.workPackage}</Tag>
              )}
              {node.fieldSite && <Tag color={colors.brandWarmBlue}>{node.fieldSite}</Tag>}
              {node.frictions.map((f) => (
                <Tag key={`f-${f}`} color={FRICTIONS[f].color}>
                  {FRICTIONS[f].label}
                </Tag>
              ))}
              {node.qualities.map((q) => (
                <Tag key={`q-${q}`} color={QUALITIES[q].color}>
                  {QUALITIES[q].label}
                </Tag>
              ))}
              {node.houseThemes.map((t) => (
                <Tag key={`t-${t}`}>{t.replace(/_/g, " ")}</Tag>
              ))}
            </div>
          )}
          <div
            style={{
              ...typography.sizes.t16,
              color: colors.textBody,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {node.body}
          </div>
          <p
            style={{
              ...typography.sizes.t12,
              color: colors.textMuted,
              marginTop: space.s24,
              paddingTop: space.s12,
              borderTop: `1px solid ${colors.borderSubtle}`,
            }}
          >
            {node.degree} {node.degree === 1 ? "kobling" : "koblinger"} via delte kategorier
          </p>
        </div>
      </motion.aside>
    </>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  const accent = color ?? colors.brandWarmBlue;
  return (
    <span
      style={{
        ...typography.sizes.t12,
        padding: `2px ${space.s8}`,
        background: `${accent}22`,
        color: accent,
        border: `1px solid ${accent}`,
        borderRadius: 4,
        fontWeight: typography.weights.medium,
      }}
    >
      {children}
    </span>
  );
}

// ─── Sidebar ───

function FilterSidebar({
  open,
  onToggle,
  filters,
  setFilters,
  search,
  setSearch,
  totalNodes,
  visibleNodes,
  edgesCount,
  listNodes,
  searchHits,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onToggle: () => void;
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  search: string;
  setSearch: (next: string) => void;
  totalNodes: number;
  visibleNodes: number;
  edgesCount: number;
  listNodes: GraphNode[];
  searchHits: Set<string> | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const orderedList = useMemo(() => {
    const sorted = [...listNodes].sort((a, b) => a.title.localeCompare(b.title, "nb"));
    if (!searchHits) return sorted;
    return sorted.sort((a, b) => Number(searchHits.has(b.id)) - Number(searchHits.has(a.id)));
  }, [listNodes, searchHits]);

  return (
    <aside
      style={{
        background: colors.bgCard,
        borderRight: `1px solid ${colors.borderSubtle}`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Skjul sidepanel" : "Vis sidepanel"}
        style={{
          position: "absolute",
          top: space.s12,
          right: space.s12,
          zIndex: 5,
          ...typography.sizes.t12,
          background: colors.bgCard,
          border: `1px solid ${colors.borderSubtle}`,
          padding: `2px ${space.s8}`,
          cursor: "pointer",
          fontFamily: FONT_STACK,
          color: colors.textMuted,
        }}
      >
        {open ? "‹" : "›"}
      </button>

      {open && (
        <>
          <div
            style={{
              padding: `${space.s24} ${space.s24} ${space.s16}`,
              display: "flex",
              flexDirection: "column",
              gap: space.s12,
              flexShrink: 0,
            }}
          >
            <div>
              <p
                style={{
                  ...typography.sizes.t12,
                  fontWeight: typography.weights.bold,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: colors.textMuted,
                  marginBottom: space.s4,
                }}
              >
                Node map
              </p>
              <p
                style={{
                  ...typography.sizes.t12,
                  color: colors.textMuted,
                  lineHeight: 1.6,
                }}
              >
                {visibleNodes} av {totalNodes} noder · {edgesCount} koblinger.
              </p>
              <div
                style={{
                  marginTop: space.s8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 11,
                  color: colors.textMuted,
                  lineHeight: 1.5,
                }}
                aria-label="Forklaring av kantene"
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: 18,
                      height: 3,
                      background: MANUAL_EDGE,
                      borderRadius: 2,
                    }}
                  />
                  Sterk kobling — manuelt opprettet
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: 18,
                      height: 1,
                      background: NEUTRAL_EDGE,
                      opacity: 0.5,
                      borderRadius: 2,
                    }}
                  />
                  Svak kobling — felles kategori
                </span>
              </div>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søk i tittel eller tekst…"
              style={{
                padding: `${space.s8} ${space.s12}`,
                ...typography.sizes.t14,
                fontFamily: FONT_STACK,
                background: colors.bg,
                color: colors.textBody,
                border: `1px solid ${colors.borderSubtle}`,
              }}
            />

            <div style={{ display: "flex", gap: space.s4, flexWrap: "wrap" }}>
              {(["all", "notes", "insights"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilters({ ...filters, type: t })}
                  style={{
                    ...typography.sizes.t12,
                    padding: `${space.s4} ${space.s8}`,
                    background: filters.type === t ? colors.brandDarkBlue : "transparent",
                    color: filters.type === t ? colors.textLight : colors.textBody,
                    border: `1px solid ${filters.type === t ? colors.brandDarkBlue : colors.borderSubtle}`,
                    cursor: "pointer",
                    fontFamily: FONT_STACK,
                    fontWeight: typography.weights.medium,
                  }}
                >
                  {t === "all" ? "Alt" : t === "notes" ? "Notater" : "Innsikter"}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              borderTop: `1px solid ${colors.borderSubtle}`,
              borderBottom: `1px solid ${colors.borderSubtle}`,
              background: colors.bgSubtle,
            }}
          >
            {orderedList.length === 0 ? (
              <p
                style={{
                  padding: space.s16,
                  ...typography.sizes.t12,
                  color: colors.textMuted,
                  fontStyle: "italic",
                }}
              >
                Ingen noder matcher filtrene.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {orderedList.map((n) => {
                  const dim = searchHits ? !searchHits.has(n.id) : false;
                  const active = selectedId === n.id;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(n.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: `${space.s8} ${space.s16}`,
                          background: active ? colors.bgCard : "transparent",
                          borderLeft: `3px solid ${
                            active
                              ? n.kind === "insight"
                                ? INSIGHT_COLOR
                                : NOTE_COLOR
                              : "transparent"
                          }`,
                          borderTop: "none",
                          borderRight: "none",
                          borderBottom: `1px solid ${colors.borderSubtle}`,
                          cursor: "pointer",
                          fontFamily: FONT_STACK,
                          opacity: dim ? 0.45 : 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            ...typography.sizes.t12,
                            color: n.kind === "insight" ? INSIGHT_COLOR : NOTE_COLOR,
                            fontWeight: typography.weights.bold,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {n.kind === "insight" ? "Innsikt" : "Notat"}
                        </span>
                        <span
                          style={{
                            ...typography.sizes.t14,
                            color: colors.textBody,
                            fontWeight: typography.weights.medium,
                            lineHeight: 1.4,
                          }}
                        >
                          {n.title || "(uten tittel)"}
                        </span>
                        <span
                          style={{
                            ...typography.sizes.t12,
                            color: colors.textMuted,
                          }}
                        >
                          {n.degree} {n.degree === 1 ? "kobling" : "koblinger"}
                          {n.workPackage ? ` · ${n.workPackage}` : ""}
                          {n.fieldSite ? ` · ${n.fieldSite}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <details
            style={{
              padding: `${space.s12} ${space.s24} ${space.s24}`,
              flexShrink: 0,
              maxHeight: "45%",
              overflowY: "auto",
            }}
          >
            <summary
              style={{
                ...typography.sizes.t12,
                fontWeight: typography.weights.bold,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: colors.textMuted,
                cursor: "pointer",
                padding: `${space.s4} 0`,
              }}
            >
              Filtre & legende
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s16, marginTop: space.s12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
                <SidebarLabel>Friksjoner</SidebarLabel>
                <ToggleSet<CareFriction>
                  keys={FRICTION_KEYS}
                  labelOf={(k) => FRICTIONS[k].label}
                  colorOf={(k) => FRICTIONS[k].color}
                  selected={filters.frictions}
                  onChange={(next) => setFilters({ ...filters, frictions: next })}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
                <SidebarLabel>Kvaliteter</SidebarLabel>
                <ToggleSet<CareQuality>
                  keys={QUALITY_KEYS}
                  labelOf={(k) => QUALITIES[k].label}
                  colorOf={(k) => QUALITIES[k].color}
                  selected={filters.qualities}
                  onChange={(next) => setFilters({ ...filters, qualities: next })}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
                <SidebarLabel>Arbeidspakke</SidebarLabel>
                <ToggleSet<WorkPackage>
                  keys={WP_OPTIONS}
                  labelOf={(k) => k}
                  selected={filters.workPackages}
                  onChange={(next) => setFilters({ ...filters, workPackages: next })}
                />
              </div>

              <div style={{ display: "flex", gap: space.s8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      type: "all",
                      frictions: new Set(),
                      qualities: new Set(),
                      workPackages: new Set(),
                    })
                  }
                  style={{
                    ...typography.sizes.t12,
                    padding: `${space.s4} ${space.s12}`,
                    background: "transparent",
                    color: colors.textMuted,
                    border: `1px solid ${colors.borderSubtle}`,
                    cursor: "pointer",
                    fontFamily: FONT_STACK,
                  }}
                >
                  Nullstill filtre
                </button>
              </div>

              <div
                style={{
                  padding: space.s12,
                  background: colors.bgSubtle,
                  border: `1px solid ${colors.borderSubtle}`,
                  ...typography.sizes.t12,
                  color: colors.textMuted,
                }}
              >
                <p style={{ marginBottom: 2 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, background: NOTE_COLOR, marginRight: 6, borderRadius: "50%" }} />
                  Quick note
                </p>
                <p>
                  <span style={{ display: "inline-block", width: 10, height: 10, background: INSIGHT_COLOR, marginRight: 6, borderRadius: "50%" }} />
                  Innsikt
                </p>
                <p style={{ marginTop: space.s8, lineHeight: 1.5 }}>
                  Linjer kobler noder som deler en tag — friksjonsfargen brukes når koblingen
                  går via en friksjon, ellers nøytralgrå.
                </p>
              </div>
            </div>
          </details>
        </>
      )}
    </aside>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        ...typography.sizes.t12,
        fontWeight: typography.weights.bold,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: colors.textMuted,
      }}
    >
      {children}
    </span>
  );
}

function ToggleSet<T extends string>({
  keys,
  labelOf,
  colorOf,
  selected,
  onChange,
}: {
  keys: T[];
  labelOf: (k: T) => string;
  colorOf?: (k: T) => string;
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4 }}>
      {keys.map((k) => {
        const on = selected.has(k);
        const accent = colorOf?.(k) ?? colors.brandWarmBlue;
        return (
          <button
            key={k}
            type="button"
            onClick={() => {
              const next = new Set(selected);
              if (next.has(k)) next.delete(k);
              else next.add(k);
              onChange(next);
            }}
            style={{
              ...typography.sizes.t12,
              padding: `2px ${space.s8}`,
              background: on ? accent : "transparent",
              color: on ? colors.textLight : accent,
              border: `1px solid ${accent}`,
              cursor: "pointer",
              fontFamily: FONT_STACK,
              fontWeight: typography.weights.medium,
              borderRadius: 4,
            }}
          >
            {labelOf(k)}
          </button>
        );
      })}
    </div>
  );
}

// dedupe is exported only to silence the "unused" lint when adjusting the
// node-builders later; tree-shaking removes it from the bundle if unused.
export { dedupe };
