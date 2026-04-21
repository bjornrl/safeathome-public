import { supabase } from "./supabase";
import type { PublicStory, PublicConnection, PublicResource, CareFriction, ResourceType } from "./types";
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
  return data;
}

export interface SolutionItem {
  id: string;
  title: string;
  description: string;
  stage: string;
  frictions: CareFriction[];
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
