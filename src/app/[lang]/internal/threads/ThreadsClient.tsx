"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addLogEntry,
  addThreadItem,
  createThread,
  getThread,
  listThreads,
  removeThreadItem,
  updateThread,
  updateThreadItem,
  type Thread,
  type ThreadItem,
  type ThreadLogEntry,
} from "@/lib/threads";
import { loadCorpus, type CorpusNode } from "@/lib/corpus";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fill } from "@/lib/i18n/dictionary";

/**
 * The analysis workspace.
 *
 * Threads are a separate entrance, not a layer over everything else: nothing
 * here touches the note submission flow. Data collectors get a readable window
 * into the analysis; analysts get somewhere to build an argument.
 */
export default function ThreadsClient() {
  const { t, tax, intlLocale } = useI18n();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  // ?thread=<id> opens straight into a thread — that is where the discreet
  // thread list on a note detail view points.
  const [openId, setOpenId] = useState<string | null>(() => searchParams.get("thread"));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setThreads(await listThreads());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // All setState inside refresh/load happens after an await; the rule cannot
    // see across the await boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  if (error) {
    return <p style={{ ...typography.sizes.t14, color: "#a83f34" }}>
        {fill(t.threads.loadError, { error })}
      </p>;
  }

  if (openId) {
    return (
      <ThreadDetail
        id={openId}
        onBack={() => {
          setOpenId(null);
          void refresh();
        }}
      />
    );
  }

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <NewThreadForm onCreated={(t) => setOpenId(t.id)} />

      {threads === null ? (
        <p style={muted}>{t.common.loading}</p>
      ) : threads.length === 0 ? (
        <p style={{ ...typography.sizes.t16, color: colors.textMuted, maxWidth: 620, lineHeight: 1.6 }}>
          {t.threads.empty}
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {threads.map((thread) => (
            <li key={thread.id} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <button
                type="button"
                onClick={() => setOpenId(thread.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: `${space.s16} 0`,
                  cursor: "pointer",
                  fontFamily: FONT_STACK,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: space.s8, flexWrap: "wrap" }}>
                  <span style={{ ...typography.sizes.t18, fontWeight: typography.weights.medium, color: colors.textBody }}>
                    {thread.title}
                  </span>
                  {/* Status only when it deviates from the default — marking
                      "open" on everything would be noise. */}
                  {thread.status !== "open" && (
                    <Badge label={tax.threadStatus[thread.status]} color="#7a756b" />
                  )}
                  {thread.vetted && <Badge label={t.threads.vetted} color="#0e7c66" />}
                </span>
                <span style={{ ...typography.sizes.t12, color: colors.textMuted }}>
                  {fill(t.threads.lastChanged, {
                    date: new Date(thread.updated_at).toLocaleDateString(intlLocale, {
                      day: "numeric",
                      month: "short",
                    }),
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewThreadForm({ onCreated }: { onCreated: (t: Thread) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={primaryButton}>
        {t.threads.newThread}
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
          onCreated(await createThread(title.trim(), summary.trim()));
        } finally {
          setSaving(false);
        }
      }}
      style={{ display: "flex", flexDirection: "column", gap: space.s12, marginBottom: space.s32, maxWidth: 640 }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.threads.titlePlaceholder}
        style={input}
        autoFocus
      />
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={t.threads.summaryPlaceholder}
        rows={3}
        style={{ ...input, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: space.s8 }}>
        <button type="submit" disabled={saving || !title.trim()} style={primaryButton}>
          {saving ? t.common.saving : t.threads.create}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={linkButton}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}

function ThreadDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, tax, intlLocale } = useI18n();
  const [thread, setThread] = useState<Thread | null>(null);
  const [items, setItems] = useState<ThreadItem[]>([]);
  const [log, setLog] = useState<ThreadLogEntry[]>([]);
  const [summary, setSummary] = useState("");
  const [savedSummary, setSavedSummary] = useState("");
  const [showLogHint, setShowLogHint] = useState(false);
  const [logDraft, setLogDraft] = useState<string | null>(null);
  const [corpus, setCorpus] = useState<CorpusNode[]>([]);
  const [finding, setFinding] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const r = await getThread(id);
    setThread(r.thread);
    setItems(r.items);
    setLog(r.log);
    setSummary(r.thread?.summary ?? "");
    setSavedSummary(r.thread?.summary ?? "");
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    loadCorpus().then((c) => setCorpus(c.nodes)).catch(() => setCorpus([]));
  }, []);

  async function saveSummary() {
    await updateThread(id, { summary });
    // Dumb heuristic on purpose: a big change in length is a cheap proxy for
    // "the interpretation moved". Never blocking, always dismissable.
    const changed = Math.abs(summary.length - savedSummary.length);
    if (savedSummary.length > 0 && changed / Math.max(savedSummary.length, 1) > 0.4) {
      setShowLogHint(true);
    }
    setSavedSummary(summary);
  }

  if (!thread) return <p style={muted}>{t.common.loading}</p>;

  const inThread = new Set(items.map((i) => i.source_id));
  const candidates = query.trim()
    ? corpus
        .filter((n) => !inThread.has(n.rawId))
        .filter((n) => (n.title + " " + n.body).toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <button type="button" onClick={onBack} style={{ ...linkButton, marginBottom: space.s16 }}>
        {t.threads.allThreads}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: space.s12, flexWrap: "wrap", marginBottom: space.s16 }}>
        <h2 style={{ ...typography.sizes.t24, fontWeight: typography.weights.bold, color: colors.textBody, margin: 0 }}>
          {thread.title}
        </h2>
        {thread.vetted && <Badge label={t.threads.vetted} color="#0e7c66" />}
      </div>

      <div style={{ display: "flex", gap: space.s8, marginBottom: space.s24, flexWrap: "wrap" }}>
        <select
          value={thread.status}
          onChange={async (e) => {
            await updateThread(id, { status: e.target.value as Thread["status"] });
            void load();
          }}
          style={{ ...input, padding: `${space.s4} ${space.s8}` }}
          aria-label={t.threads.statusLabel}
        >
          {(["open", "parked", "landed"] as const).map((s) => (
            <option key={s} value={s}>{tax.threadStatus[s]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={async () => {
            await updateThread(id, { vetted: !thread.vetted });
            void load();
          }}
          style={linkButton}
        >
          {thread.vetted ? t.threads.unmarkVetted : t.threads.markVetted}
        </button>
      </div>

      <label style={{ ...typography.sizes.t12, fontWeight: typography.weights.medium, color: colors.textMuted }}>
        {t.threads.argumentLabel}
      </label>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onBlur={saveSummary}
        rows={5}
        style={{ ...input, width: "100%", resize: "vertical", marginTop: space.s8, marginBottom: space.s8 }}
      />
      {summary !== savedSummary && <p style={muted}>{t.threads.unsaved}</p>}

      {showLogHint && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe3a3", padding: space.s12, marginBottom: space.s16 }}>
          <p style={{ ...typography.sizes.t14, margin: 0, color: "#7a5c00" }}>
            {t.threads.interpretationChanged}
          </p>
          <div style={{ display: "flex", gap: space.s8, marginTop: space.s8 }}>
            <button type="button" onClick={() => { setLogDraft(""); setShowLogHint(false); }} style={linkButton}>
              {t.threads.addTurn}
            </button>
            <button type="button" onClick={() => setShowLogHint(false)} style={linkButton}>
              {t.threads.notNow}
            </button>
          </div>
        </div>
      )}

      <h3 style={sectionHeading}>{fill(t.threads.notesInThread, { n: items.length })}</h3>
      {items.length === 0 ? (
        <p style={muted}>{t.threads.noItems}</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, marginBottom: space.s24 }}>
          {items.map((it) => {
            const src = corpus.find((n) => n.rawId === it.source_id);
            return (
              <li key={it.id} style={{ borderBottom: `1px solid ${colors.borderSubtle}`, padding: `${space.s12} 0` }}>
                <p style={{ ...typography.sizes.t16, fontWeight: typography.weights.medium, color: colors.textBody, margin: 0 }}>
                  {src?.title ?? t.threads.missingSource}
                </p>
                <textarea
                  defaultValue={it.note}
                  onBlur={(e) => updateThreadItem(it.id, { note: e.target.value })}
                  placeholder={t.threads.itemNotePlaceholder}
                  rows={2}
                  style={{ ...input, width: "100%", resize: "vertical", marginTop: space.s8 }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    await removeThreadItem(it.id);
                    void load();
                  }}
                  style={{ ...linkButton, color: "#a83f34" }}
                >
                  {t.common.remove}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <h3 style={sectionHeading}>{t.threads.findNotes}</h3>
      {!finding ? (
        <button type="button" onClick={() => setFinding(true)} style={linkButton}>
          {t.threads.searchCorpus}
        </button>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.threads.searchPlaceholder}
            style={{ ...input, width: "100%", maxWidth: 480 }}
            autoFocus
          />
          <ul style={{ listStyle: "none", margin: `${space.s12} 0 0`, padding: 0 }}>
            {candidates.map((n) => (
              <li key={n.id} style={{ padding: `${space.s8} 0`, display: "flex", justifyContent: "space-between", gap: space.s12 }}>
                <span style={{ ...typography.sizes.t14, color: colors.textBody }}>{n.title}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await addThreadItem(id, n.kind === "quick_note" ? "quick_note" : n.kind, n.rawId, "", items.length);
                    setQuery("");
                    void load();
                  }}
                  style={linkButton}
                >
                  {t.common.add}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {(log.length > 0 || logDraft !== null) && (
        <>
          <h3 style={sectionHeading}>{t.threads.previousInterpretations}</h3>
          {logDraft !== null && (
            <div style={{ marginBottom: space.s16 }}>
              <textarea
                value={logDraft}
                onChange={(e) => setLogDraft(e.target.value)}
                placeholder={t.threads.turnPlaceholder}
                rows={3}
                style={{ ...input, width: "100%", resize: "vertical" }}
                autoFocus
              />
              <button
                type="button"
                onClick={async () => {
                  if (logDraft.trim()) await addLogEntry(id, logDraft.trim());
                  setLogDraft(null);
                  void load();
                }}
                style={primaryButton}
              >
                {t.threads.saveTurn}
              </button>
            </div>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {log.map((l) => (
              <li key={l.id} style={{ borderLeft: `2px solid ${colors.borderSubtle}`, paddingLeft: space.s12, marginBottom: space.s12 }}>
                <p style={{ ...typography.sizes.t14, color: colors.textBody, margin: 0 }}>{l.entry}</p>
                <span style={{ ...typography.sizes.t12, color: colors.textMuted }}>
                  {new Date(l.logged_at).toLocaleDateString(intlLocale, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {log.length === 0 && logDraft === null && (
        <button type="button" onClick={() => setLogDraft("")} style={{ ...linkButton, marginTop: space.s16 }}>
          {t.threads.addTurn}
        </button>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: color + "15", color }}>
      {label}
    </span>
  );
}

const input: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: 15,
  padding: `${space.s8} ${space.s12}`,
  border: `1px solid ${colors.borderSubtle}`,
  background: colors.bgCard,
  color: colors.textBody,
};

const primaryButton: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: 14,
  fontWeight: 600,
  padding: `${space.s8} ${space.s16}`,
  background: "#1f42aa",
  color: "#ffffff",
  border: "none",
  cursor: "pointer",
  marginBottom: space.s24,
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
  // Block, or consecutive link buttons ("Søk i materialet" and "Legg til
  // vending") run together as one line of text. Flex parents override this.
  display: "block",
  textAlign: "left",
};

const sectionHeading: React.CSSProperties = {
  ...typography.sizes.t12,
  fontWeight: typography.weights.medium,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: colors.textMuted,
  marginTop: space.s32,
  marginBottom: space.s12,
};

const muted: React.CSSProperties = {
  ...typography.sizes.t14,
  color: colors.textMuted,
};
