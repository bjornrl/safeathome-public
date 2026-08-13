import { supabase } from "./supabase";
import type {
  CareFriction,
  CareQuality,
  FieldSite,
  HouseTheme,
  Insight,
  MapScale,
  PublicResource,
  QuickNote,
  ResourceType,
  WorkPackage,
} from "./types";

/**
 * The corpus — one loader for every view that shows "the material".
 *
 * The node map, /frictions and /qualities are three presentations of the same
 * thing. They used to load it three different ways, and drifted: the taxonomy
 * pages read `public_stories` behind a coordinate filter while the node map
 * read notes and insights, so the same note could appear in one view and be
 * invisible in another. Anything that changes what "the material" means belongs
 * here, so the three cannot separate again.
 */

export type CorpusKind = "quick_note" | "insight" | "resource";

export interface CorpusNode {
  /** Namespaced so ids stay unique across the three tables. */
  id: string;
  /** The bare row id, for links into the editor and detail views. */
  rawId: string;
  kind: CorpusKind;
  title: string;
  body: string;
  frictions: CareFriction[];
  qualities: CareQuality[];
  workPackage: WorkPackage | null;
  fieldSite: FieldSite | null;
  houseThemes: HouseTheme[];
  mapScale: MapScale | null;
  resourceType: ResourceType | null;
  createdAt: string | null;
  raw: QuickNote | Insight | PublicResource;
}

export interface CorpusConnectionRow {
  from_note_id: string | null;
  from_insight_id: string | null;
  to_note_id: string | null;
  to_insight_id: string | null;
}

export interface Corpus {
  nodes: CorpusNode[];
  /** Manual links drawn in the note editor. */
  connections: CorpusConnectionRow[];
  /**
   * Non-fatal load failures. Resources and links are secondary: losing them
   * should degrade the view, not blank it. They must still be *shown* though —
   * silently swallowing them is how a half-loaded graph passes for a complete
   * one (strategidokumentet U4).
   */
  partial: string[];
}

export function noteToNode(n: QuickNote): CorpusNode {
  return {
    id: `note:${n.id}`,
    rawId: n.id,
    kind: "quick_note",
    title: (n.headline?.trim() || (n.body ? n.body.slice(0, 60) : "(uten tittel)")).trim(),
    body: n.body ?? "",
    frictions: n.care_frictions ?? [],
    qualities: n.care_qualities ?? [],
    workPackage: n.work_package,
    fieldSite: n.field_site,
    houseThemes: n.house_themes ?? [],
    mapScale: n.map_scale,
    resourceType: null,
    createdAt: n.created_at ?? null,
    raw: n,
  };
}

export function insightToNode(i: Insight): CorpusNode {
  return {
    id: `insight:${i.id}`,
    rawId: i.id,
    kind: "insight",
    title: i.title,
    body: i.body ?? "",
    // The `insights` table has no taxonomy columns yet, so insights can only
    // connect through work package and field site — which makes them
    // systematically peripheral in the graph. Left as-is deliberately: adding
    // speculative tag fields before the table has them would be inventing data
    // (prompt 03, punkt 11).
    frictions: [],
    qualities: [],
    workPackage: i.work_package,
    fieldSite: i.field_site,
    houseThemes: [],
    mapScale: null,
    resourceType: null,
    createdAt: i.created_at ?? null,
    raw: i,
  };
}

export function resourceToNode(
  r: PublicResource,
  links: { frictions: CareFriction[]; qualities: CareQuality[] },
): CorpusNode {
  return {
    id: `resource:${r.id}`,
    rawId: r.id,
    kind: "resource",
    title: r.title,
    body: r.description ?? "",
    frictions: links.frictions,
    qualities: links.qualities,
    workPackage: null,
    fieldSite: r.field_site,
    houseThemes: r.theme ? [r.theme] : [],
    mapScale: r.map_scale,
    resourceType: r.type,
    createdAt: r.created_at ?? null,
    raw: r,
  };
}

/**
 * Throws when notes or insights fail — without those there is no corpus and the
 * caller should render an error with a retry. Everything else degrades into
 * `partial`.
 */
export async function loadCorpus(): Promise<Corpus> {
  const [notesRes, insightsRes, resourcesRes, resFrictionsRes, resQualitiesRes, connRes] =
    await Promise.all([
      supabase.from("quick_notes").select("*"),
      supabase.from("insights").select("*"),
      supabase.from("public_resources").select("*"),
      supabase.from("public_resource_frictions").select("resource_id, friction_key"),
      supabase.from("public_resource_qualities").select("resource_id, quality_key"),
      supabase
        .from("note_connections")
        .select("from_note_id, from_insight_id, to_note_id, to_insight_id"),
    ]);

  if (notesRes.error || insightsRes.error) {
    throw new Error(
      notesRes.error?.message ?? insightsRes.error?.message ?? "Klarte ikke å hente materialet.",
    );
  }

  const partial: string[] = [];
  if (resourcesRes.error) partial.push("ressurser");
  if (resFrictionsRes.error || resQualitiesRes.error) partial.push("ressurskoblinger");
  if (connRes.error) partial.push("manuelle koblinger");

  const resourceLinks = new Map<string, { frictions: CareFriction[]; qualities: CareQuality[] }>();
  const ensure = (id: string) => {
    const entry = resourceLinks.get(id) ?? { frictions: [], qualities: [] };
    resourceLinks.set(id, entry);
    return entry;
  };
  for (const row of (resFrictionsRes.data ?? []) as { resource_id: string; friction_key: CareFriction }[]) {
    ensure(row.resource_id).frictions.push(row.friction_key);
  }
  for (const row of (resQualitiesRes.data ?? []) as { resource_id: string; quality_key: CareQuality }[]) {
    ensure(row.resource_id).qualities.push(row.quality_key);
  }

  const nodes: CorpusNode[] = [
    ...((notesRes.data as QuickNote[] | null) ?? []).map(noteToNode),
    ...((insightsRes.data as Insight[] | null) ?? []).map(insightToNode),
    ...((resourcesRes.data as PublicResource[] | null) ?? []).map((r) =>
      resourceToNode(r, resourceLinks.get(r.id) ?? { frictions: [], qualities: [] }),
    ),
  ];

  return {
    nodes,
    connections: (connRes.data ?? []) as CorpusConnectionRow[],
    partial,
  };
}

/** Everything in the corpus carrying a given friction. */
export function nodesWithFriction(nodes: CorpusNode[], key: CareFriction): CorpusNode[] {
  return nodes.filter((n) => n.frictions.includes(key));
}

/** Everything in the corpus carrying a given quality. */
export function nodesWithQuality(nodes: CorpusNode[], key: CareQuality): CorpusNode[] {
  return nodes.filter((n) => n.qualities.includes(key));
}
