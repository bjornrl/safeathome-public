"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fill } from "@/lib/i18n/dictionary";
import { clay, motion, radius, space, typography } from "@/lib/design-tokens";
import { sendContactMessage } from "@/app/actions/contact";

/**
 * Always-available way for a visitor to reach the project leads.
 *
 * Mounted once in the [lang] layout, so it rides along on every page — public
 * and internal alike. Deliberately one-way: the visitor sends, we answer by
 * email. A reply channel inside the widget would need anonymous sessions and
 * an inbox UI, and would still be slower than mail for everyone involved.
 *
 * Chat framing is the affordance, not the mechanism: people recognise the
 * bubble and know what it costs them, which is exactly the low threshold a
 * "tell us what's wrong with this page" channel needs.
 */

const MAX_BODY = 4000;
/** Show the counter only once the limit is actually in sight. */
const COUNTER_FROM = 3800;

type Phase = "idle" | "sending" | "sent";

export default function ContactWidget() {
  const { t, lang } = useI18n();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  /** The address the confirmation refers to, frozen before the form resets. */
  const [sentTo, setSentTo] = useState<string | null>(null);

  const openedAt = useRef<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the launcher: a keyboard user who closes the panel would
    // otherwise be dropped at the top of the document.
    launcherRef.current?.focus();
  }, []);

  // Escape closes, from anywhere inside the panel.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    openedAt.current = Date.now();
    textareaRef.current?.focus();
  }, [open]);

  async function handleSend() {
    const trimmed = body.trim();
    if (trimmed.length < 2) {
      setError(t.contact.errorEmpty);
      textareaRef.current?.focus();
      return;
    }

    setPhase("sending");
    setError(null);

    let result;
    try {
      result = await sendContactMessage({
        body: trimmed,
        name,
        email,
        pagePath: pathname ?? undefined,
        lang,
        elapsedMs: Date.now() - openedAt.current,
        trap,
      });
    } catch {
      // Network failure or a server error the action didn't catch.
      setPhase("idle");
      setError(t.contact.errorGeneric);
      return;
    }

    if (result.status === "sent") {
      setSentTo(email.trim() || null);
      setPhase("sent");
      setBody("");
      setName("");
      setEmail("");
      setTrap("");
      return;
    }

    setPhase("idle");
    if (result.status === "rate_limited") setError(t.contact.errorRate);
    else if (result.status === "invalid") setError(t.contact.errorEmail);
    else setError(t.contact.errorGeneric);
  }

  function reopenForm() {
    setPhase("idle");
    setSentTo(null);
    setError(null);
    openedAt.current = Date.now();
    textareaRef.current?.focus();
  }

  const remaining = MAX_BODY - body.length;
  const busy = phase === "sending";

  return (
    <>
      {/* The launcher stays mounted while the panel is open so focus has
          somewhere to return to on close. */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? t.contact.closeLabel : t.contact.openLabel}
        style={{
          position: "fixed",
          right: space.s24,
          bottom: space.s24,
          zIndex: 60,
          display: "inline-flex",
          alignItems: "center",
          gap: space.s8,
          padding: `${space.s12} ${space.s16}`,
          minHeight: "48px",
          background: clay.colors.ink,
          color: clay.colors.onPrimary,
          border: `1px solid ${clay.colors.ink}`,
          borderRadius: radius.pill,
          fontFamily: clay.font.body,
          fontWeight: 600,
          ...typography.sizes.t14,
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.18)",
          transition: `transform ${motion.fast}, opacity ${motion.fast}`,
        }}
      >
        <ChatIcon open={open} />
        {/* The label is hidden on narrow screens where it would crowd the
            content; the aria-label above carries the meaning regardless. */}
        <span className="contact-launcher-label">
          {open ? t.common.close : t.contact.launcher}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={t.contact.title}
          style={{
            position: "fixed",
            right: space.s24,
            bottom: "84px",
            zIndex: 60,
            width: "min(370px, calc(100vw - 32px))",
            maxHeight: "min(560px, calc(100vh - 120px))",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: space.s16,
            padding: space.s24,
            background: clay.colors.surfaceCard,
            border: `1px solid ${clay.colors.hairline}`,
            borderRadius: radius.lg,
            boxShadow: "0 18px 48px rgba(0, 0, 0, 0.20)",
            fontFamily: clay.font.body,
          }}
        >
          <header style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
            <h2
              style={{
                margin: 0,
                ...typography.sizes.t18,
                fontWeight: 600,
                letterSpacing: "-0.3px",
                color: clay.colors.ink,
              }}
            >
              {t.contact.title}
            </h2>
            <p style={{ margin: 0, ...typography.sizes.t12, color: clay.colors.muted }}>
              {t.contact.subtitle}
            </p>
          </header>

          {/* The greeting bubble — the one piece of chat costume. It carries
              real information (who reads this), so it is not pure decoration. */}
          <p
            style={{
              margin: 0,
              padding: `${space.s12} ${space.s16}`,
              background: clay.colors.surfaceSoft,
              border: `1px solid ${clay.colors.hairline}`,
              borderRadius: radius.md,
              borderBottomLeftRadius: radius.none,
              ...typography.sizes.t14,
              color: clay.colors.body,
            }}
          >
            {phase === "sent" ? t.contact.sentTitle : t.contact.greeting}
          </p>

          {phase === "sent" ? (
            <>
              <p style={{ margin: 0, ...typography.sizes.t14, color: clay.colors.body }}>
                {sentTo
                  ? fill(t.contact.sentWithEmail, { email: sentTo })
                  : t.contact.sentNoEmail}
              </p>
              <div style={{ display: "flex", gap: space.s8 }}>
                <PanelButton onClick={reopenForm} variant="secondary">
                  {t.contact.again}
                </PanelButton>
                <PanelButton onClick={close} variant="primary">
                  {t.common.close}
                </PanelButton>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              style={{ display: "flex", flexDirection: "column", gap: space.s12 }}
            >
              <FieldShell label={t.contact.messageLabel}>
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
                  placeholder={t.contact.messagePlaceholder}
                  rows={4}
                  required
                  disabled={busy}
                  style={{ ...panelInputStyle, minHeight: "96px", resize: "vertical" }}
                />
              </FieldShell>

              {body.length >= COUNTER_FROM && (
                <p style={{ margin: 0, ...typography.sizes.t12, color: clay.colors.muted }}>
                  {fill(t.contact.charsLeft, { n: remaining })}
                </p>
              )}

              <FieldShell label={t.contact.nameLabel} optional={t.contact.optional}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.contact.namePlaceholder}
                  autoComplete="name"
                  disabled={busy}
                  style={panelInputStyle}
                />
              </FieldShell>

              <FieldShell
                label={t.contact.emailLabel}
                optional={t.contact.optional}
                helper={t.contact.emailHelper}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.contact.emailPlaceholder}
                  autoComplete="email"
                  disabled={busy}
                  style={panelInputStyle}
                />
              </FieldShell>

              {/* Honeypot. Hidden from sight, from screen readers and from tab
                  order — only a form-filling script will put anything here. */}
              <div aria-hidden style={{ position: "absolute", left: "-9999px" }}>
                <label>
                  Firma
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={trap}
                    onChange={(e) => setTrap(e.target.value)}
                  />
                </label>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{ margin: 0, ...typography.sizes.t12, color: "var(--pkt-color-brand-red-1000)" }}
                >
                  {error}
                </p>
              )}

              <PanelButton type="submit" variant="primary" disabled={busy} fullWidth>
                {busy ? t.contact.sending : t.contact.send}
              </PanelButton>
            </form>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          .contact-launcher-label { display: none; }
        }
      `}</style>
    </>
  );
}

const panelInputStyle: React.CSSProperties = {
  width: "100%",
  padding: `${space.s8} ${space.s12}`,
  fontFamily: clay.font.body,
  // 16px keeps iOS Safari from zooming the viewport on focus.
  fontSize: "16px",
  lineHeight: "24px",
  color: clay.colors.ink,
  background: clay.colors.canvas,
  border: `1px solid ${clay.colors.hairline}`,
  borderRadius: radius.md,
};

function FieldShell({
  label,
  optional,
  helper,
  children,
}: {
  label: string;
  optional?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
      <span style={{ ...typography.sizes.t12, fontWeight: 600, color: clay.colors.bodyStrong }}>
        {label}
        {optional && (
          <span style={{ fontWeight: 400, color: clay.colors.muted }}> ({optional})</span>
        )}
      </span>
      {children}
      {helper && (
        <span style={{ ...typography.sizes.t12, color: clay.colors.muted }}>{helper}</span>
      )}
    </label>
  );
}

function PanelButton({
  children,
  onClick,
  type = "button",
  variant,
  disabled,
  fullWidth,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant: "primary" | "secondary";
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? "100%" : undefined,
        minHeight: "44px",
        padding: `${space.s8} ${space.s16}`,
        background: primary ? clay.colors.ink : clay.colors.canvas,
        color: primary ? clay.colors.onPrimary : clay.colors.ink,
        border: `1px solid ${primary ? clay.colors.ink : clay.colors.hairline}`,
        borderRadius: radius.md,
        fontFamily: clay.font.body,
        fontWeight: 600,
        ...typography.sizes.t14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: `opacity ${motion.fast}`,
      }}
    >
      {children}
    </button>
  );
}

/** Speech bubble, swapping to a cross once the panel is open. */
function ChatIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
