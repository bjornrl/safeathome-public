"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { clay, colors, motion, space, typography } from "@/lib/design-tokens";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { CONTACT_MESSAGE_MAX } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fill } from "@/lib/i18n/dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries/no";

/**
 * Ruta svarer med en kode; her ligger oversettelsen. Faller tilbake på
 * serverens egen tekst når koden er ukjent, slik at en feil vi ikke har
 * oversatt ennå vises som norsk melding framfor å bli borte.
 */
function errorFor(
  t: Dictionary,
  payload: { error?: string; code?: string; length?: number; max?: number } | null,
): string {
  switch (payload?.code) {
    case "empty":
      return t.contact.errorEmpty;
    case "too_long":
      return fill(t.contact.errorTooLong, {
        n: payload.length ?? 0,
        max: payload.max ?? CONTACT_MESSAGE_MAX,
      });
    case "unauthorized":
      return t.contact.errorUnauthorized;
    case "bad_request":
      return t.contact.errorBadRequest;
    case "not_configured":
      return t.contact.errorNotConfigured;
    case "send_failed":
      return t.contact.errorSendFailed;
    default:
      return payload?.error ?? t.contact.errorGeneric;
  }
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Meldingsskjemaet. Én komponent, to innganger: seksjonen på /internal og
 * boblen nede til høyre (ContactWidget). Avsenderen er alltid den innloggede,
 * så skjemaet spør verken om navn eller e-post.
 */
export default function ContactForm({
  compact = false,
  onSent,
}: {
  /** Tettere layout, brukt inne i boblen. */
  compact?: boolean;
  onSent?: () => void;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const tooLong = trimmed.length > CONTACT_MESSAGE_MAX;
  const canSend = trimmed.length > 0 && !tooLong && status !== "sending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, subject, fromPath: pathname }),
      });

      // Ruta svarer alltid JSON. Får vi noe annet, har proxyen eller et
      // mellomledd svart i stedet — behandle det som en feil framfor å la
      // res.json() kaste en uleselig SyntaxError.
      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.ok) {
        setError(errorFor(t, payload));
        setStatus("error");
        return;
      }

      setStatus("sent");
      setSubject("");
      setMessage("");
      onSent?.();
    } catch {
      setError(t.contact.errorNetwork);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        style={{
          padding: compact ? space.s16 : space.s24,
          background: clay.colors.surfaceSoft,
          borderRadius: "var(--clay-radius-md)",
          fontFamily: clay.font.body,
        }}
      >
        <p
          style={{
            ...typography.sizes.t16,
            fontWeight: 600,
            color: clay.colors.ink,
            margin: `0 0 ${space.s8}`,
          }}
        >
          {t.contact.sentTitle}
        </p>
        <p style={{ ...typography.sizes.t14, color: clay.colors.muted, margin: `0 0 ${space.s16}` }}>
          {t.contact.sentBody}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setStatus("idle")}>
          {t.contact.again}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? space.s12 : space.s16,
        fontFamily: clay.font.body,
      }}
    >
      <Field label={t.contact.subjectLabel}>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t.contact.subjectPlaceholder}
          disabled={status === "sending"}
        />
      </Field>

      <Field
        label={t.contact.messageLabel}
        error={
          tooLong
            ? fill(t.contact.errorTooLong, { n: trimmed.length, max: CONTACT_MESSAGE_MAX })
            : undefined
        }
      >
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.contact.messagePlaceholder}
          required
          disabled={status === "sending"}
          style={{ minHeight: compact ? "120px" : "160px", resize: "vertical" }}
        />
      </Field>

      {error && (
        <p
          role="alert"
          style={{ ...typography.sizes.t14, color: colors.brandRed, margin: 0 }}
        >
          {error}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: space.s16 }}>
        <Button type="submit" variant="primary" size={compact ? "sm" : "md"} disabled={!canSend}>
          {status === "sending" ? t.contact.sending : t.contact.send}
        </Button>
        <span
          style={{
            ...typography.sizes.t12,
            color: clay.colors.muted,
            transition: `color ${motion.fast}`,
          }}
        >
          {t.contact.sentFromAccount}
        </span>
      </div>
    </form>
  );
}
