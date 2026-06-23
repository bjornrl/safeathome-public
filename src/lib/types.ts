export type HouseTheme =
  | "front_door"
  | "living_room"
  | "kitchen"
  | "bedroom"
  | "study"
  | "childrens_room"
  | "garden"
  | "phone"
  | "prayer_space"
  | "bathroom"
  | "hallway";

export type FieldSite = "Alna" | "Søndre Nordstrand";

export type MapScale = "micro" | "meso" | "macro";

export type CareFriction =
  | "rotate"
  | "script"
  | "isolate"
  | "reduce"
  | "exclude"
  | "invisible"
  | "displace";

export type CareQuality =
  | "transnational_flow"
  | "household_choreography"
  | "invisible_labor"
  | "cultural_anchoring"
  | "adaptive_resistance"
  | "intergenerational_exchange"
  | "digital_bridging"
  | "belonging_negotiation";

export type ConnectionType = "direct" | "indirect";

export type ResourceType =
  | "publication"
  | "policy_brief"
  | "toolkit"
  | "practice_guide"
  | "teaching_guide"
  | "experience";

export interface PublicStory {
  id: string;
  title: string;
  body: string;
  source_insight_id: string | null;
  theme: HouseTheme | null;
  home_based: boolean;
  field_site: FieldSite | null;
  work_package: WorkPackage | null;
  frictions: CareFriction[];
  qualities: CareQuality[];
  map_scale: MapScale;
  latitude: number | null;
  longitude: number | null;
  media_urls: string[];
  author_credit: string;
  published: boolean;
  published_at: string;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PublicDesignResponse {
  id: string;
  title: string;
  body: string;
  source_challenge_id: string | null;
  theme: HouseTheme;
  frictions: CareFriction[];
  qualities: CareQuality[];
  map_scale: MapScale;
  latitude: number | null;
  longitude: number | null;
  stage: string;
  outcome: string;
  media_urls: string[];
  published: boolean;
  published_at: string;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PublicConnection {
  id: string;
  from_story_id: string;
  to_story_id: string;
  // deprecated: will be removed after UI migrates to category_key
  friction: CareFriction;
  category_kind: "friction" | "quality";
  category_key: string;
  connection_type: ConnectionType;
  description: string | null;
  published: boolean;
  created_at: string;
}

export interface PublicResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string | null;
  authors: string | null;
  year: number | null;
  field_site: FieldSite | null;
  theme: HouseTheme | null;
  map_scale: MapScale | null;
  file_url: string | null;
  file_name: string | null;
  published: boolean;
  created_at: string;
}

export interface PublicPage {
  id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  updated_at: string;
}

export interface CategoryDescription {
  key: string;
  long_description: string;
  examples: string[];
  updated_at: string;
}

export interface WpReport {
  id: string;
  wp_id: string;
  month: string;
  summary: string;
  highlights: string[];
  next_steps: string;
  interviewer: string;
  interviewee: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceStoryLink {
  resource_id: string;
  story_id: string;
}

export interface ResourceFrictionLink {
  resource_id: string;
  friction_key: CareFriction;
}

export interface ResourceQualityLink {
  resource_id: string;
  quality_key: CareQuality;
}

// ─── Internal platform: profiles, quick notes, insights, suggested categories ───

export type Institution =
  | "OsloMet"
  | "UiO"
  | "Durham"
  | "Comte Bureau"
  | "Alna District"
  | "Søndre Nordstrand"
  | "Skien Municipality";

export type UserRole = "researcher" | "municipal_partner" | "designer" | "admin";

// DB enum is uppercase WP1..WP4; the codebase elsewhere uses lowercase wp1..wp4.
export type WorkPackage = "WP1" | "WP2" | "WP3" | "WP4";

export type MaterialType =
  | "fieldnote"
  | "photo"
  | "sketch"
  | "map"
  | "transcript"
  | "case_study"
  | "policy_doc"
  | "workshop_output"
  | "prototype_doc";

export interface Profile {
  id: string;
  full_name: string;
  institution: Institution;
  role: UserRole;
  work_packages: WorkPackage[] | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  author_id: string;
  work_package: WorkPackage;
  field_site: FieldSite;
  material_type: MaterialType;
  tags: string[];
  flagged_for_design: boolean;
  flagged_by: string | null;
  flagged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuickNote {
  id: string;
  author_id: string | null;
  headline: string | null;
  body: string;
  work_package: WorkPackage | null;
  field_site: FieldSite | null;
  house_themes: HouseTheme[] | null;
  care_frictions: CareFriction[] | null;
  care_qualities: CareQuality[] | null;
  map_scale: MapScale | null;
  created_at: string;
  updated_at: string;
}

// Polymorphic edge: exactly one of from_*_id and one of to_*_id is set.
export interface NoteConnection {
  id: string;
  from_note_id: string | null;
  from_insight_id: string | null;
  to_note_id: string | null;
  to_insight_id: string | null;
  created_by: string | null;
  created_at: string;
}

export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface SuggestedCategory {
  id: string;
  label: string;
  description: string | null;
  suggested_by: string | null;
  status: SuggestionStatus;
  created_at: string;
}

export interface CommentRow {
  id: string;
  body: string;
  author_id: string;
  insight_id: string | null;
  challenge_id: string | null;
  quick_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WelfareTechnology {
  id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[] | null;
  url: string | null;
  image_url: string | null;
  manufacturer: string | null;
  country_availability: string[] | null;
  notes: string | null;
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type LinkableEntityKind = "quick_note" | "insight" | "story" | "resource";

export interface LinkableEntity {
  kind: LinkableEntityKind;
  id: string;
  title: string;
  subtitle: string | null;
  updated_at: string;
}
