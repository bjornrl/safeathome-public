/**
 * Sending av kontaktmeldinger via Resend.
 *
 * Skjemaet er internt — bare innloggede team-medlemmer ser det — så avsenderen
 * er alltid kjent fra økta. Derfor ingen navn/e-post-felt i skjemaet, og ingen
 * spam-beskyttelse utover innloggingen selv.
 *
 * Vi kaller Resend sitt REST-endepunkt direkte i stedet for å dra inn
 * `resend`-pakken: kallet er ett POST med JSON, og det sparer oss for en
 * avhengighet som må versjons-vedlikeholdes.
 */

import { CONTACT_MESSAGE_MAX, CONTACT_SUBJECT_MAX } from "./constants";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Resend sin test-avsender. Krever ingen verifisert domene, men leverer
 *  *bare* til e-postadressen som eier Resend-kontoen. Sett CONTACT_FROM_EMAIL
 *  til en adresse på et verifisert domene for å sende til hvem som helst. */
// Visningsnavnet må stå i hermetegn: "safe@home" inneholder en @, og et
// usitert display-name med @ er ugyldig etter RFC 5322 — Resend svarer 422.
const DEFAULT_FROM = '"safe@home" <onboarding@resend.dev>';

export const MESSAGE_MAX = CONTACT_MESSAGE_MAX;
export const SUBJECT_MAX = CONTACT_SUBJECT_MAX;

export interface ContactMessage {
  /** Fritekst fra avsenderen. Påkrevd. */
  message: string;
  /** Valgfri emnelinje. */
  subject?: string;
  /** Stien meldingen ble sendt fra, f.eks. "/internal/threads". */
  fromPath?: string;
  /** E-posten til den innloggede avsenderen — brukes som reply-to. */
  senderEmail: string;
}

export type SendResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactEmail(msg: ContactMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  // Manglende konfigurasjon er en drift-feil, ikke en bruker-feil. Logg den
  // tydelig på serveren og gi klienten en nøytral 500 — nøkkelnavn hører ikke
  // hjemme i et svar som går ut i nettleseren.
  if (!apiKey || !to) {
    console.error(
      "[contact] Mangler konfigurasjon:",
      !apiKey ? "RESEND_API_KEY" : "",
      !to ? "CONTACT_TO_EMAIL" : "",
    );
    return { ok: false, error: "Kontaktskjemaet er ikke satt opp.", status: 500 };
  }

  const subject = msg.subject?.trim()
    ? `[safe@home] ${msg.subject.trim()}`
    : "[safe@home] Ny melding fra plattformen";

  const meta = [
    `Fra: ${msg.senderEmail}`,
    msg.fromPath ? `Side: ${msg.fromPath}` : null,
    `Tid: ${new Date().toLocaleString("nb-NO", { timeZone: "Europe/Oslo" })}`,
  ].filter(Boolean) as string[];

  const text = `${meta.join("\n")}\n\n---\n\n${msg.message}`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.55">
<p style="color:#6a698b;margin:0 0 16px">${meta.map(escapeHtml).join("<br>")}</p>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px">
<div style="white-space:pre-wrap;color:#2a2859">${escapeHtml(msg.message)}</div>
</div>`;

  let res: Response;
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: [to],
        // Svar går rett til den som skrev meldingen, ikke til avsender-domenet.
        reply_to: msg.senderEmail,
        subject,
        text,
        html,
      }),
    });
  } catch (err) {
    console.error("[contact] Resend nådde ikke fram:", err);
    return { ok: false, error: "Fikk ikke kontakt med e-posttjenesten.", status: 502 };
  }

  if (!res.ok) {
    // Resend-feil er nesten alltid konfigurasjon (uverifisert domene, ugyldig
    // nøkkel). Detaljene hører hjemme i serverloggen, ikke i nettleseren.
    console.error("[contact] Resend svarte", res.status, await res.text().catch(() => ""));
    return { ok: false, error: "E-posten kunne ikke sendes.", status: 502 };
  }

  return { ok: true };
}
