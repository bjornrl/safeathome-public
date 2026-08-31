"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  appendSourceToThread,
  createThread,
  listThreads,
  threadsForSource,
  type Thread,
  type ThreadSourceType,
} from "@/lib/threads";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fill } from "@/lib/i18n/dictionary";

/**
 * The one analysis surface a data collector meets.
 *
 * Two things, both read-only as far as the submission flow is concerned: which
 * threads this note already carries — a window into what the analysts made of
 * it — and a way to put it in one. Nothing here adds a field to note creation.
 */
export default function ThreadMembership({
  sourceType,
  sourceId,
}: {
  sourceType: ThreadSourceType;
  sourceId: string;
}) {
  const { t, href } = useI18n();
  const [memberOf, setMemberOf] = useState<Thread[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [all, setAll] = useState<Thread[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMemberOf(await threadsForSource(sourceType, sourceId));
    } catch {
      // A missing threads table (migration not run) should not take the note
      // detail view down with it — the section simply stays empty.
      setMemberOf([]);
    }
  }, [sourceType, sourceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPicker() {
    setPicking(true);
    setError(null);
    try {
      setAll(await listThreads());
    } catch (e) {
      setError((e as Error).message);
      setAll([]);
    }
  }

  async function addTo(threadId: string) {
    setBusy(true);
    setError(null);
    try {
      await appendSourceToThread(threadId, sourceType, sourceId);
      setPicking(false);
      setNewTitle("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const t = await createThread(newTitle.trim(), "");
      await appendSourceToThread(t.id, sourceType, sourceId);
      setPicking(false);
      setNewTitle("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (memberOf === null) return null;

  const memberIds = new Set(memberOf.map((t) => t.id));
  const available = (all ?? []).filter((t) => !memberIds.has(t.id));

  return (
    <section style={{ fontFamily: FONT_STACK, display: "flex", flexDirection: "column", gap: space.s8 }}>
      <p style={heading}>{t.threads.membershipHeading}</p>

      {memberOf.length === 0 ? (
        <p style={{ ...typography.sizes.t14, color: colors.textMuted, margin: 0 }}>
          {fill(t.threads.notInAnyThread, { noun: t.threads.sourceNoun[sourceType] })}
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s4 }}>
          {memberOf.map((thread) => (
            <li key={thread.id}>
              <Link href={href(`/internal/threads?thread=${thread.id}`)} style={threadLink}>
                {thread.title}
              </Link>
              {thread.vetted && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0e7c66", marginLeft: space.s8 }}>
                  {t.threads.vetted}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!picking ? (
        <button type="button" onClick={openPicker} style={linkButton}>
          {t.threads.addToThread}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: space.s8, marginTop: space.s4 }}>
          {all === null ? (
            <p style={{ ...typography.sizes.t14, color: colors.textMuted, margin: 0 }}>{t.threads.loadingThreads}</p>
          ) : (
            <>
              {available.length > 0 && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s4 }}>
                  {available.map((thread) => (
                    <li
                      key={thread.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: space.s12 }}
                    >
                      <span style={{ ...typography.sizes.t14, color: colors.textBody }}>{thread.title}</span>
                      <button type="button" disabled={busy} onClick={() => addTo(thread.id)} style={linkButton}>
                        {t.common.add}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ display: "flex", gap: space.s8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={available.length > 0 ? t.threads.orNewThread : t.threads.newThreadTitle}
                  style={input}
                />
                <button type="button" disabled={busy || !newTitle.trim()} onClick={createAndAdd} style={linkButton}>
                  {t.threads.createAndAdd}
                </button>
              </div>

              <button type="button" onClick={() => setPicking(false)} style={{ ...linkButton, color: colors.textMuted }}>
                {t.common.cancel}
              </button>
            </>
          )}
        </div>
      )}

      {error && <p style={{ ...typography.sizes.t12, color: "#a83f34", margin: 0 }}>{error}</p>}
    </section>
  );
}

const heading: React.CSSProperties = {
  ...typography.sizes.t12,
  fontWeight: typography.weights.medium,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: colors.textMuted,
  margin: 0,
};

const threadLink: React.CSSProperties = {
  ...typography.sizes.t14,
  color: "#1f42aa",
  fontWeight: typography.weights.medium,
  textDecoration: "none",
};

const linkButton: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: 13,
  fontWeight: 600,
  color: "#1f42aa",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
  alignSelf: "flex-start",
  textAlign: "left",
};

const input: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: 14,
  padding: `${space.s4} ${space.s8}`,
  border: `1px solid ${colors.borderSubtle}`,
  background: colors.bgCard,
  color: colors.textBody,
  flex: "1 1 200px",
  minWidth: 0,
};
