import { supabase } from "./supabase";
import type {
  PublicStory,
  PublicConnection,
  PublicResource,
  CareFriction,
  CareQuality,
  ResourceType,
  CategoryDescription,
  WpReport,
} from "./types";
import { SEED_STORIES, SEED_CONNECTIONS } from "./seed-data";
import { SEED_SOLUTIONS } from "./seed-solutions";
import { SEED_RESOURCES } from "./seed-resources";

export async function getMapStories(): Promise<PublicStory[]> {
  const { data, error } = await supabase
    .from("public_stories")
    .select("*")
    .eq("published", true)
    .not("latitude", "is", null)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return SEED_STORIES;
  return data;
}

export async function getAllStories(): Promise<PublicStory[]> {
  const { data, error } = await supabase
    .from("public_stories")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return SEED_STORIES;
  return data;
}

export async function getConnections(): Promise<PublicConnection[]> {
  const { data, error } = await supabase
    .from("public_connections")
    .select("*")
    .eq("published", true);

  if (error || !data || data.length === 0) return SEED_CONNECTIONS;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    ...r,
    category_kind: r.category_kind ?? "friction",
    category_key: r.category_key ?? r.friction,
  })) as PublicConnection[];
}

export interface SolutionItem {
  id: string;
  title: string;
  description: string;
  stage: string;
  frictions: CareFriction[];
  qualities: CareQuality[];
  outcome: string | null;
  source_stories: string[];
}

export async function getDesignResponses(): Promise<SolutionItem[]> {
  const { data, error } = await supabase
    .from("public_design_responses")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return SEED_SOLUTIONS.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      stage: s.stage,
      frictions: s.frictions,
      qualities: [],
      outcome: s.outcome || null,
      source_stories: s.source_stories,
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.body ?? r.description ?? "",
    stage: r.stage ?? "mapping",
    frictions: (r.frictions ?? []) as CareFriction[],
    qualities: (r.qualities ?? []) as CareQuality[],
    outcome: r.outcome ?? null,
    source_stories: (r.source_stories ?? []) as string[],
  }));
}

export async function getResources(types?: ResourceType[]): Promise<PublicResource[]> {
  let query = supabase
    .from("public_resources")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (types && types.length > 0) {
    query = query.in("type", types);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    const seed = SEED_RESOURCES.filter((r) => r.published);
    return types && types.length > 0
      ? seed.filter((r) => types.includes(r.type))
      : seed;
  }
  return data as PublicResource[];
}

export async function getFrictionDescriptions(): Promise<CategoryDescription[]> {
  const { data, error } = await supabase
    .from("public_friction_descriptions")
    .select("*");

  if (error || !data) return [];
  return data as CategoryDescription[];
}

export async function getQualityDescriptions(): Promise<CategoryDescription[]> {
  const { data, error } = await supabase
    .from("public_quality_descriptions")
    .select("*");

  if (error || !data) return [];
  return data as CategoryDescription[];
}

export async function getWpReports(): Promise<WpReport[]> {
  const { data, error } = await supabase
    .from("public_wp_reports")
    .select("*")
    .eq("published", true)
    .order("month", { ascending: false })
    .order("wp_id", { ascending: true });

  if (error || !data) return [];
  return data as WpReport[];
}

export async function getResourceLinks(resourceId: string): Promise<{
  stories: string[];
  frictions: CareFriction[];
  qualities: CareQuality[];
}> {
  const [storyRes, frictionRes, qualityRes] = await Promise.all([
    supabase.from("public_resource_stories").select("story_id").eq("resource_id", resourceId),
    supabase.from("public_resource_frictions").select("friction_key").eq("resource_id", resourceId),
    supabase.from("public_resource_qualities").select("quality_key").eq("resource_id", resourceId),
  ]);

  return {
    stories: (storyRes.data ?? []).map((r) => r.story_id as string),
    frictions: (frictionRes.data ?? []).map((r) => r.friction_key as CareFriction),
    qualities: (qualityRes.data ?? []).map((r) => r.quality_key as CareQuality),
  };
}

export type ResourceLinksByResource = Record<
  string,
  { stories: string[]; frictions: CareFriction[]; qualities: CareQuality[] }
>;

export async function getAllResourceLinks(): Promise<ResourceLinksByResource> {
  const [storyRes, frictionRes, qualityRes] = await Promise.all([
    supabase.from("public_resource_stories").select("resource_id, story_id"),
    supabase.from("public_resource_frictions").select("resource_id, friction_key"),
    supabase.from("public_resource_qualities").select("resource_id, quality_key"),
  ]);

  const out: ResourceLinksByResource = {};
  const ensure = (id: string) => {
    if (!out[id]) out[id] = { stories: [], frictions: [], qualities: [] };
    return out[id];
  };
  for (const r of storyRes.data ?? []) ensure(r.resource_id as string).stories.push(r.story_id as string);
  for (const r of frictionRes.data ?? []) ensure(r.resource_id as string).frictions.push(r.friction_key as CareFriction);
  for (const r of qualityRes.data ?? []) ensure(r.resource_id as string).qualities.push(r.quality_key as CareQuality);
  return out;
}
