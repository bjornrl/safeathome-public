import { supabase } from "./supabase";

/**
 * Tråder — analyselaget.
 *
 * En tråd er et argument under arbeid: en tese med tilknyttede notater som
 * lever i månedsvis og endrer seg. Annotasjonen på hvert element (`note`) er
 * det analytiske arbeidet — uten den er tråden en mappe, ikke et argument.
 *
 * Flat redaksjon: alle innloggede leser, oppretter og redigerer alt.
 */

export type ThreadStatus = "open" | "parked" | "landed";
export type ThreadSourceType = "quick_note" | "insight" | "story" | "resource";

export interface Thread {
  id: string;
  title: string;
  summary: string;
  status: ThreadStatus;
  vetted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThreadItem {
  id: string;
  thread_id: string;
  source_type: ThreadSourceType;
  source_id: string;
  note: string;
  position: number;
  added_by: string | null;
  added_at: string;
}

export interface ThreadLogEntry {
  id: string;
  thread_id: string;
  entry: string;
  logged_by: string | null;
  logged_at: string;
}

export const STATUS_LABEL: Record<ThreadStatus, string> = {
  open: "Åpen",
  parked: "Parkert",
  landed: "Landet",
};

export async function listThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Thread[];
}

/** The three most recently touched — for the /internal front page. */
export async function recentThreads(limit = 3): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Thread[];
}

export async function getThread(id: string): Promise<{
  thread: Thread | null;
  items: ThreadItem[];
  log: ThreadLogEntry[];
}> {
  const [threadRes, itemsRes, logRes] = await Promise.all([
    supabase.from("threads").select("*").eq("id", id).maybeSingle(),
    supabase.from("thread_items").select("*").eq("thread_id", id).order("position"),
    supabase.from("thread_log").select("*").eq("thread_id", id).order("logged_at", { ascending: false }),
  ]);
  if (threadRes.error) throw new Error(threadRes.error.message);
  return {
    thread: (threadRes.data as Thread | null) ?? null,
    items: (itemsRes.data ?? []) as ThreadItem[],
    log: (logRes.data ?? []) as ThreadLogEntry[],
  };
}

export async function createThread(title: string, summary: string): Promise<Thread> {
  const { data: sessionData } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from("threads")
    .insert({
      title,
      summary,
      created_by: sessionData.session?.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Thread;
}

export async function updateThread(
  id: string,
  patch: Partial<Pick<Thread, "title" | "summary" | "status" | "vetted">>,
): Promise<void> {
  const { error } = await supabase.from("threads").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteThread(id: string): Promise<void> {
  // Items and log rows go with it (ON DELETE CASCADE); the sources never do.
  const { error } = await supabase.from("threads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addThreadItem(
  threadId: string,
  sourceType: ThreadSourceType,
  sourceId: string,
  note: string,
  position: number,
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from("thread_items").insert({
    thread_id: threadId,
    source_type: sourceType,
    source_id: sourceId,
    note,
    position,
    added_by: sessionData.session?.user?.id ?? null,
  });
  if (error) throw new Error(error.message);
  await touchThread(threadId);
}

export async function updateThreadItem(id: string, patch: Partial<Pick<ThreadItem, "note" | "position">>): Promise<void> {
  const { error } = await supabase.from("thread_items").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeThreadItem(id: string): Promise<void> {
  const { error } = await supabase.from("thread_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addLogEntry(threadId: string, entry: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from("thread_log").insert({
    thread_id: threadId,
    entry,
    logged_by: sessionData.session?.user?.id ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Which threads a given source appears in — the window in, from a note. */
export async function threadsForSource(
  sourceType: ThreadSourceType,
  sourceId: string,
): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("thread_items")
    .select("thread_id")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);
  if (error || !data || data.length === 0) return [];
  const ids = data.map((r) => (r as { thread_id: string }).thread_id);
  const { data: threads } = await supabase.from("threads").select("*").in("id", ids);
  return (threads ?? []) as Thread[];
}

/** Nudge updated_at so the thread rises in the list when its items change. */
async function touchThread(id: string): Promise<void> {
  await supabase.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", id);
}
