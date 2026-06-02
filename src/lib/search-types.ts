// Shared types + label helpers for semantic search. Kept in a plain module
// (not the "use server" action file, which may only export async functions,
// and not the "server-only" embeddings lib, which can't be imported by the
// client search UI).
import type { EmbeddableSourceType } from "@/lib/embeddings";

export type { EmbeddableSourceType };

export type SearchHit = {
  sourceType: EmbeddableSourceType;
  sourceId: string;
  title: string;
  snippet: string;
  href: string | null;
  score: number;
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
