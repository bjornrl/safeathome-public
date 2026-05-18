"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  drag as d3drag,
  select as d3select,
} from "d3";
import type {
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
  D3DragEvent,
} from "d3";
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

type NodeKind = "quick_note" | "insight";

interface GraphNode extends SimulationNodeDatum {
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
  | { kind: "house_theme"; key: HouseTheme };

interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  id: string;
  source: GraphNode | string;
  target: GraphNode | string;
  category: EdgeCategory;
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
  return NEUTRAL_EDGE;
}

function edgeLabel(category: EdgeCategory): string {
  if (category.kind === "friction") return FRICTIONS[category.key].label;
  if (category.kind === "quality") return QUALITIES[category.key].label;
  if (category.kind === "work_package") return category.key;
  if (category.kind === "field_site") return category.key;
  return category.key.replace(/_/g, " ");
}

export default function NodeMapClient() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<GraphNode, GraphEdge> | null>(null);
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // tick counter forces re-render on each simulation step.
  const [, setTick] = useState(0);

  // ── Resize SVG to container ──
  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: Math.max(window.innerHeight - 120, 600) });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Load nodes + build edges ──
  useEffect(() => {
    let active = true;
    (async () => {
      const [notesRes, insightsRes] = await Promise.all([
        supabase.from("quick_notes").select("*"),
        supabase.from("insights").select("*"),
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

      const builtEdges: GraphEdge[] = [];
      const degree: Record<string, number> = {};
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
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
    return edges.filter((e) => {
      const sId = typeof e.source === "string" ? e.source : e.source.id;
      const tId = typeof e.target === "string" ? e.target : e.target.id;
      return visibleNodeIds.has(sId) && visibleNodeIds.has(tId);
    });
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

  // ── D3 force simulation ──
  // useLayoutEffect so the synchronous pre-warm + setTick happens before
  // the browser paints — otherwise the user briefly sees every node piled
  // at (0, 0) before the layout snaps to its settled positions.
  useLayoutEffect(() => {
    if (nodes.length === 0) return;
    // Seed nodes around the canvas centre so the first paint isn't a pile in
    // the top-left corner. Existing positions (e.g. after a drag) are kept.
    const cx = size.width / 2;
    const cy = size.height / 2;
    const radius = Math.min(size.width, size.height) * 0.32;
    nodes.forEach((n, i) => {
      if (n.x == null || n.y == null) {
        const angle = (i / nodes.length) * Math.PI * 2;
        const jitter = 0.6 + Math.random() * 0.4;
        n.x = cx + Math.cos(angle) * radius * jitter;
        n.y = cy + Math.sin(angle) * radius * jitter;
      }
    });

    const sim = forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(80)
          .strength(0.4),
      )
      .force("charge", forceManyBody().strength(-200))
      .force("center", forceCenter(cx, cy))
      .force("collide", forceCollide<GraphNode>().radius(20))
      .alphaDecay(0.04)
      .stop();

    // Pre-warm synchronously so the first render shows a settled layout
    // instead of nodes animating outwards from (0, 0).
    for (let i = 0; i < 300; i++) sim.tick();

    simulationRef.current = sim;
    sim.on("tick", () => setTick((v) => v + 1));
    setTick((v) => v + 1);

    return () => {
      sim.stop();
      simulationRef.current = null;
    };
  }, [nodes, edges, size.width, size.height]);

  // ── Drag handler ──
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    const sim = simulationRef.current;
    const sel = d3select(svgRef.current).selectAll<SVGGElement, GraphNode>("g.node");
    sel.call(
      d3drag<SVGGElement, GraphNode>()
        .on("start", function (event: D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
          if (!event.active) sim.alphaTarget(0.3).restart();
          const d = event.subject;
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", function (event: D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
          const d = event.subject;
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", function (event: D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
          if (!event.active) sim.alphaTarget(0);
          const d = event.subject;
          d.fx = null;
          d.fy = null;
        }),
    );
  }, [nodes, size]);

  const zoomToFit = useCallback(() => {
    if (nodes.length === 0) return;
    const xs = nodes.map((n) => n.x ?? 0);
    const ys = nodes.map((n) => n.y ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = 60;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;
    const k = Math.min(size.width / Math.max(w, 1), size.height / Math.max(h, 1), 1.5);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setTransform({
      k,
      x: size.width / 2 - cx * k,
      y: size.height / 2 - cy * k,
    });
  }, [nodes, size]);

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
          onZoomToFit={zoomToFit}
          totalNodes={nodes.length}
          visibleNodes={visibleNodeIds.size}
          edgesCount={visibleEdges.length}
          listNodes={nodes.filter((n) => visibleNodeIds.has(n.id))}
          searchHits={searchHits}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div style={{ position: "relative", overflow: "hidden", background: colors.bgSubtle }}>
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
            width={size.width - (sidebarOpen ? 420 : 0)}
            height={size.height}
            style={{ display: "block", cursor: "grab" }}
            role="img"
            aria-label="Force-directed graph of quick notes and insights"
          >
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
              {visibleEdges.map((e) => {
                const sId = typeof e.source === "string" ? e.source : e.source.id;
                const tId = typeof e.target === "string" ? e.target : e.target.id;
                const sNode = nodes.find((n) => n.id === sId);
                const tNode = nodes.find((n) => n.id === tId);
                if (!sNode || !tNode) return null;
                const isHighlighted = hoveredId === sId || hoveredId === tId;
                return (
                  <line
                    key={e.id}
                    x1={sNode.x ?? 0}
                    y1={sNode.y ?? 0}
                    x2={tNode.x ?? 0}
                    y2={tNode.y ?? 0}
                    stroke={edgeColor(e.category)}
                    strokeOpacity={isHighlighted ? 0.9 : 0.4}
                    strokeWidth={isHighlighted ? 2 : 1}
                  />
                );
              })}
              {nodes
                .filter((n) => visibleNodeIds.has(n.id))
                .map((n) => {
                  const dim = searchHits ? !searchHits.has(n.id) : false;
                  const r = radiusFor(n);
                  const fill = n.kind === "insight" ? INSIGHT_COLOR : NOTE_COLOR;
                  return (
                    <g
                      key={n.id}
                      className="node"
                      transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
                      onMouseEnter={() => setHoveredId(n.id)}
                      onMouseLeave={() => setHoveredId(null)}
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
        {node.kind === "insight" ? "Innsikt" : "Quick note"}
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
        {tagCount} {tagCount === 1 ? "tag" : "tags"} · {node.degree} {node.degree === 1 ? "kobling" : "koblinger"}
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
            {node.kind === "insight" ? "Innsikt" : "Quick note"}
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
  onZoomToFit,
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
  onZoomToFit: () => void;
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
                  onClick={onZoomToFit}
                  style={{
                    ...typography.sizes.t12,
                    padding: `${space.s4} ${space.s12}`,
                    background: colors.bgSubtle,
                    color: colors.textBody,
                    border: `1px solid ${colors.borderSubtle}`,
                    cursor: "pointer",
                    fontFamily: FONT_STACK,
                    fontWeight: typography.weights.medium,
                  }}
                >
                  Zoom to fit
                </button>
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
