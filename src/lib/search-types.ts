// Shared types + label helpers for semantic search. Kept in a plain module
// (not the "use server" action file, which may only export async functions,
// and not the "server-only" embeddings lib, which can't be imported by the
// client search UI).
import type { EmbeddableSourceType } from "@/lib/embeddings";
import type { CareFriction, CareQuality, FieldSite, WorkPackage } from "@/lib/types";

export type { EmbeddableSourceType };

export type SearchHit = {
  sourceType: EmbeddableSourceType;
  sourceId: string;
  title: string;
  snippet: string;
  href: string | null;
  score: number;
};

// Full content for a single hit, hydrated on click for the slide-in detail
// panel. Frictions/qualities are returned as keys; the client maps them to
// labels + colours via @/lib/constants (mirrors the node map).
export type SearchHitDetail = {
  sourceType: EmbeddableSourceType;
  sourceId: string;
  title: string;
  body: string;
  href: string | null;
  external: boolean; // href should open in a new tab
  isFile: boolean; // href points to an uploaded document, not an external link
  workPackage: WorkPackage | null;
  fieldSite: FieldSite | null;
  frictions: CareFriction[];
  qualities: CareQuality[];
  tags: string[]; // free-text / house themes / resource type — already humanised
};

export type SearchResponse =
  | { status: "ok"; hits: SearchHit[]; mode: "hybrid" | "keyword" }
  | { status: "empty" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

const SOURCE_LABELS: Record<EmbeddableSourceType, string> = {
  insight: "Innsikt",
  quick_note: "Notat",
  story: "Historie",
  resource: "Ressurs",
};

export function sourceLabel(t: EmbeddableSourceType): string {
  return SOURCE_LABELS[t];
}
