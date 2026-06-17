import type { SuggestionRelated, SuggestionRelatedType } from "@/app/actions/suggest";
import type { LinkableEntity } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export type EntityLinkKind = "quick_note" | "insight" | "story" | "resource";

export const ENTITY_KIND_LABELS: Record<EntityLinkKind, string> = {
  quick_note: "Notat",
  insight: "Innsikt",
  story: "Publisert innsikt",
  resource: "Ressurs",
};

const ENTITY_KINDS = new Set<string>(["quick_note", "insight", "story", "resource"]);

function friendlyEntityLinksError(message: string): string {
  if (isMissingEntityLinksTable(message)) {
    return "Koblingstabellen (entity_links) mangler i databasen. Kjør supabase/migrations/0007_entity_links.sql i Supabase SQL-editor, og prøv igjen.";
  }
  return message;
}

function isMissingEntityLinksTable(message: string): boolean {
  return (
    /entity_links/i.test(message) &&
    /(schema cache|does not exist|Could not find)/i.test(message)
  );
}

export function entityLinkKey(kind: EntityLinkKind, id: string): string {
  return `${kind}:${id}`;
}

export function parseEntityLinkKey(key: string): { kind: EntityLinkKind; id: string } | null {
  const idx = key.indexOf(":");
  if (idx === -1) return null;
  const kind = key.slice(0, idx);
  const id = key.slice(idx + 1);
  if (!ENTITY_KINDS.has(kind) || !id) return null;
  return { kind: kind as EntityLinkKind, id };
}

export function suggestionRelatedToKey(r: SuggestionRelated): string {
  const map: Record<SuggestionRelatedType, EntityLinkKind> = {
    note: "quick_note",
    insight: "insight",
    story: "story",
    resource: "resource",
  };
  return entityLinkKey(map[r.type], r.id);
}

export async function loadEntityLinks(fromType: EntityLinkKind, fromId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("entity_links")
    .select("to_type, to_id")
    .eq("from_type", fromType)
    .eq("from_id", fromId);
  if (error) {
    console.warn("[entity_links] load failed:", error.message);
    return new Set();
  }
  return new Set(
    (data ?? []).map((r) => entityLinkKey(r.to_type as EntityLinkKind, r.to_id as string)),
  );
}

export async function saveEntityLinks(
  fromType: EntityLinkKind,
  fromId: string,
  linked: Set<string>,
  createdBy: string | null,
): Promise<string | null> {
  const { error: delErr } = await supabase
    .from("entity_links")
    .delete()
    .eq("from_type", fromType)
    .eq("from_id", fromId);
  if (delErr) {
    // Let saves without connections succeed until the migration is applied.
    if (linked.size === 0 && isMissingEntityLinksTable(delErr.message)) return null;
    return friendlyEntityLinksError(delErr.message);
  }

  if (linked.size === 0) return null;

  const rows = Array.from(linked)
    .map((key) => {
      const parsed = parseEntityLinkKey(key);
      if (!parsed) return null;
      return {
        from_type: fromType,
        from_id: fromId,
        to_type: parsed.kind,
        to_id: parsed.id,
        created_by: createdBy,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return null;

  const { error: insErr } = await supabase.from("entity_links").insert(rows);
  return insErr ? friendlyEntityLinksError(insErr.message) : null;
}

export function linkedIdsOfKind(linked: Set<string>, kind: EntityLinkKind): string[] {
  return Array.from(linked)
    .map((key) => parseEntityLinkKey(key))
    .filter((p): p is { kind: EntityLinkKind; id: string } => p !== null && p.kind === kind)
    .map((p) => p.id);
}

/** Hydrate linked entity rows for read-only detail views. */
export async function fetchLinkedEntities(
  fromType: EntityLinkKind,
  fromId: string,
): Promise<LinkableEntity[]> {
  let keys = await loadEntityLinks(fromType, fromId);
  if (keys.size === 0 && fromType === "quick_note") {
    keys = await loadNoteConnectionsAsEntityKeys(fromId);
  }
  if (keys.size === 0) return [];

  const byKind: Record<EntityLinkKind, string[]> = {
    quick_note: [],
    insight: [],
    story: [],
    resource: [],
  };
  for (const key of keys) {
    const parsed = parseEntityLinkKey(key);
    if (parsed) byKind[parsed.kind].push(parsed.id);
  }

  const items: LinkableEntity[] = [];
  const [notesRes, insightsRes, storiesRes, resourcesRes] = await Promise.all([
    byKind.quick_note.length
      ? supabase.from("quick_notes").select("id, headline, body, updated_at").in("id", byKind.quick_note)
      : Promise.resolve({ data: [] }),
    byKind.insight.length
      ? supabase.from("insights").select("id, title, body, updated_at").in("id", byKind.insight)
      : Promise.resolve({ data: [] }),
    byKind.story.length
      ? supabase.from("public_stories").select("id, title, body, updated_at").in("id", byKind.story)
      : Promise.resolve({ data: [] }),
    byKind.resource.length
      ? supabase.from("public_resources").select("id, title, description, updated_at").in("id", byKind.resource)
      : Promise.resolve({ data: [] }),
  ]);

  for (const n of (notesRes.data as { id: string; headline: string | null; body: string; updated_at: string }[] | null) ?? []) {
    items.push({
      kind: "quick_note",
      id: n.id,
      title: n.headline?.trim() || (n.body.length > 60 ? `${n.body.slice(0, 60)}…` : n.body),
      subtitle: null,
      updated_at: n.updated_at,
    });
  }
  for (const i of (insightsRes.data as { id: string; title: string; body: string; updated_at: string }[] | null) ?? []) {
    items.push({
      kind: "insight",
      id: i.id,
      title: i.title,
      subtitle: i.body.length > 80 ? `${i.body.slice(0, 80)}…` : i.body,
      updated_at: i.updated_at,
    });
  }
  for (const s of (storiesRes.data as { id: string; title: string; body: string; updated_at: string }[] | null) ?? []) {
    items.push({
      kind: "story",
      id: s.id,
      title: s.title,
      subtitle: s.body.length > 80 ? `${s.body.slice(0, 80)}…` : s.body,
      updated_at: s.updated_at,
    });
  }
  for (const r of (resourcesRes.data as { id: string; title: string; description: string | null; updated_at: string }[] | null) ?? []) {
    items.push({
      kind: "resource",
      id: r.id,
      title: r.title,
      subtitle: r.description
        ? r.description.length > 80
          ? `${r.description.slice(0, 80)}…`
          : r.description
        : null,
      updated_at: r.updated_at,
    });
  }

  return items.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

/** Keeps note_connections in sync for the node map (notes ↔ notes/insights only). */
export async function syncNoteConnectionsFromLinks(
  noteId: string,
  linked: Set<string>,
  createdBy: string,
): Promise<string | null> {
  const { error: delErr } = await supabase
    .from("note_connections")
    .delete()
    .or(`from_note_id.eq.${noteId},to_note_id.eq.${noteId}`);
  if (delErr) return delErr.message;

  const rows = Array.from(linked)
    .map((key) => {
      const parsed = parseEntityLinkKey(key);
      if (!parsed || (parsed.kind !== "quick_note" && parsed.kind !== "insight")) return null;
      return {
        from_note_id: noteId,
        from_insight_id: null,
        to_note_id: parsed.kind === "quick_note" ? parsed.id : null,
        to_insight_id: parsed.kind === "insight" ? parsed.id : null,
        created_by: createdBy,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return null;

  const { error: insErr } = await supabase.from("note_connections").insert(rows);
  return insErr?.message ?? null;
}

/** Fallback when entity_links has not been migrated yet. */
export async function loadNoteConnectionsAsEntityKeys(noteId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("note_connections")
    .select("from_note_id, from_insight_id, to_note_id, to_insight_id")
    .or(`from_note_id.eq.${noteId},to_note_id.eq.${noteId}`);
  if (error) return new Set();

  const keys = new Set<string>();
  for (const c of data ?? []) {
    const fromNote = c.from_note_id as string | null;
    const toNote = c.to_note_id as string | null;
    const toInsight = c.to_insight_id as string | null;
    if (fromNote === noteId && toNote) keys.add(entityLinkKey("quick_note", toNote));
    if (fromNote === noteId && toInsight) keys.add(entityLinkKey("insight", toInsight));
    if (toNote === noteId && fromNote) keys.add(entityLinkKey("quick_note", fromNote));
    if (toInsight === noteId && fromNote) keys.add(entityLinkKey("quick_note", fromNote));
  }
  return keys;
}
