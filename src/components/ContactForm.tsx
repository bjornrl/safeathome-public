"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { clay, colors, motion, space, typography } from "@/lib/design-tokens";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { CONTACT_MESSAGE_MAX } from "@/lib/constants";

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
        setError(payload?.error ?? "Meldingen ble ikke sendt. Prøv igjen.");
        setStatus("error");
        return;
      }

      setStatus("sent");
      setSubject("");
      setMessage("");
      onSent?.();
    } catch {
      setError("Fikk ikke kontakt med serveren. Sjekk nettforbindelsen.");
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
          Meldingen er sendt.
        </p>
        <p style={{ ...typography.sizes.t14, color: clay.colors.muted, margin: `0 0 ${space.s16}` }}>
          Takk — den ligger nå i innboksen.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setStatus("idle")}>
          Skriv en til
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
      <Field label="Emne (valgfritt)">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Kort om hva det gjelder"
          disabled={status === "sending"}
        />
      </Field>

      <Field
        label="Melding"
        error={tooLong ? `Meldingen er ${trimmed.length} tegn — maks er ${CONTACT_MESSAGE_MAX}.` : undefined}
      >
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Skriv meldingen her…"
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
          {status === "sending" ? "Sender…" : "Send melding"}
        </Button>
        <span
          style={{
            ...typography.sizes.t12,
            color: clay.colors.muted,
            transition: `color ${motion.fast}`,
          }}
        >
          Sendes fra kontoen du er innlogget med.
        </span>
      </div>
    </form>
  );
}
