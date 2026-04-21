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

export type FieldSite = "Alna" | "Søndre Nordstrand" | "Skien";

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
  theme: HouseTheme;
  field_site: FieldSite | null;
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
  friction: CareFriction;
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
  url: string;
  authors: string | null;
  year: number | null;
  field_site: FieldSite | null;
  theme: HouseTheme | null;
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
