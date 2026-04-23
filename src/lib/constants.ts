import type { CareFriction, CareQuality, MapScale, HouseTheme } from "./types";

// ─── Map Configuration ───
export const MAP_CONFIG = {
  center: [10.8155, 59.8976] as [number, number], // Alna, Oslo
  initialZoom: 19,
  minZoom: 9,
  maxZoom: 19,
  microToMesoZoom: 17,
  mesoToMacroZoom: 13,
};

// ─── Inline MapLibre style (raster OSM tiles — proven to work) ───
export const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// ─── District Coordinates ───
export const DISTRICTS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  alna: { center: [10.8155, 59.8976], zoom: 14, label: "Alna, Oslo" },
  sondre_nordstrand: { center: [10.7920, 59.8340], zoom: 14, label: "Søndre Nordstrand, Oslo" },
};

// ─── Care Frictions ───
export const FRICTIONS: Record<CareFriction, { label: string; color: string; description: string }> = {
  rotate:    { label: "Rotate",    color: "#C45D3E", description: "Staff turnover breaks relational continuity." },
  script:    { label: "Script",    color: "#5B6AAF", description: "Technologies and protocols embed wrong assumptions." },
  isolate:   { label: "Isolate",   color: "#3A8A7D", description: "Care plans sever people from support systems." },
  reduce:    { label: "Reduce",    color: "#8B6914", description: "Complex lives flattened to categories." },
  exclude:   { label: "Exclude",   color: "#9B59B6", description: "Barriers prevent access to services." },
  invisible: { label: "Invisible", color: "#D4A017", description: "Care work the system doesn't see." },
  displace:  { label: "Displace",  color: "#D14343", description: "Interventions make people feel less at home." },
};

// ─── Care Qualities ───
export const QUALITIES: Record<CareQuality, { label: string; color: string }> = {
  transnational_flow:         { label: "Transnational flow",         color: "#D4A017" },
  household_choreography:     { label: "Household choreography",     color: "#C45D3E" },
  invisible_labor:            { label: "Invisible labor",            color: "#7A756B" },
  cultural_anchoring:         { label: "Cultural anchoring",         color: "#9B59B6" },
  adaptive_resistance:        { label: "Adaptive resistance",        color: "#3A8A7D" },
  intergenerational_exchange: { label: "Intergenerational exchange", color: "#5B6AAF" },
  digital_bridging:           { label: "Digital bridging",           color: "#378ADD" },
  belonging_negotiation:      { label: "Belonging negotiation",      color: "#8B6914" },
};

// ─── One-liner copy for qualities (shared across /qualities and /about) ───
export const QUALITY_COPY: Record<CareQuality, string> = {
  transnational_flow:         "Care circulating across borders",
  household_choreography:     "Daily orchestration of multi-use spaces",
  invisible_labor:            "Unpaid care by relatives and community",
  cultural_anchoring:         "Practices sustaining identity",
  adaptive_resistance:        "Quietly working around services",
  intergenerational_exchange: "Bidirectional care between old and young",
  digital_bridging:           "Technology maintaining connections",
  belonging_negotiation:      "Tension between here and there",
};

// ─── Map Scale Labels ───
export const SCALES: Record<MapScale, { label: string }> = {
  micro: { label: "Inside the home" },
  meso:  { label: "Neighborhood" },
  macro: { label: "City" },
};

// ─── Work packages (WP1–WP4) ───
export type WpId = "wp1" | "wp2" | "wp3" | "wp4";

export const WP_LABELS: Record<WpId, { label: string; subtitle: string }> = {
  wp1: { label: "WP1: Homes & Communities",         subtitle: "how material spaces and social dynamics shape homecare" },
  wp2: { label: "WP2: Health & Care Institutions",  subtitle: "what barriers and enablers shape service access" },
  wp3: { label: "WP3: Transnational Contexts",      subtitle: "how cross-border ties affect aging in place" },
  wp4: { label: "WP4: Innovation & Design",         subtitle: "co-creating practical solutions with users and municipalities" },
};

// ─── House Room Positions (% coords within house overlay) ───
export const HOUSE_HOTSPOTS: { theme: HouseTheme; x: number; y: number; label: string }[] = [
  { theme: "childrens_room", x: 28, y: 17, label: "Children's room" },
  { theme: "bedroom",        x: 65, y: 17, label: "Bedroom" },
  { theme: "study",          x: 24, y: 35, label: "Study" },
  { theme: "kitchen",        x: 68, y: 37, label: "Kitchen" },
  { theme: "living_room",    x: 38, y: 55, label: "Living room" },
  { theme: "front_door",     x: 14, y: 55, label: "Front door" },
  { theme: "garden",         x: 55, y: 80, label: "Garden" },
  { theme: "phone",          x: 78, y: 56, label: "Phone" },
];
