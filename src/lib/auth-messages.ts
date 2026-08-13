import type { AuthError } from "@supabase/supabase-js";

/**
 * Norwegian auth copy, in one place so /login and /auth/reset never drift
 * apart — and so no raw English Supabase string reaches a user.
 */

/**
 * Må matche «Email OTP Length» i Supabase-dashboardet. Alt i grensesnittet —
 * placeholder, `maxLength`, `pattern` og feilmeldingen — utledes herfra, så en
 * framtidig endring i dashboardet krever bare at dette tallet følger etter.
 */
export const CODE_LENGTH = 8;

export const AUTH_MSG = {
  unknownEmail:
    "Vi fant ingen bruker med denne adressen. Ta kontakt med prosjektadministrator for tilgang.",
  badCode: "Koden er feil eller utløpt. Be om en ny kode.",
  rateLimit: "Du har bedt om for mange koder. Vent noen minutter og prøv igjen.",
  generic: "Noe gikk galt. Prøv igjen om litt.",
  noProfile:
    "Kontoen mangler en profil på plattformen. Ta kontakt med prosjektadministrator.",
  missingEmail: "Skriv inn e-postadressen din først.",
  shortCode: `Koden er ${CODE_LENGTH} siffer.`,
  wrongPassword: "Feil e-postadresse eller passord.",
  samePassword: "Det nye passordet må være forskjellig fra det forrige.",
  weakPassword: "Passordet er for svakt. Velg et lengre passord.",
  recoveryExpired:
    "Gjenopprettingslenken er utløpt. Be om en ny fra innloggingssiden.",
} as const;

/**
 * `context` disambiguates errors that share wording across flows: the same
 * "invalid" means «unknown address» when requesting a code, «wrong code» when
 * verifying one, and «expired recovery session» when setting a new password.
 */
export type AuthContext = "send" | "verify" | "password";

export function authErrorMessage(
  err: AuthError | null,
  context: AuthContext,
): string {
  if (!err) return AUTH_MSG.generic;

  const code = err.code ?? "";
  const message = err.message.toLowerCase();
  const status = err.status ?? 0;

  if (
    status === 429 ||
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("only request this after")
  ) {
    return AUTH_MSG.rateLimit;
  }

  if (context === "password") {
    if (code === "same_password" || message.includes("should be different")) {
      return AUTH_MSG.samePassword;
    }
    if (code === "weak_password" || message.includes("password should be")) {
      return AUTH_MSG.weakPassword;
    }
    // No usable recovery session left — the link was single-use or timed out.
    if (
      status === 401 ||
      status === 403 ||
      code === "session_not_found" ||
      message.includes("session") ||
      message.includes("expired") ||
      message.includes("jwt")
    ) {
      return AUTH_MSG.recoveryExpired;
    }
    return AUTH_MSG.generic;
  }

  // `shouldCreateUser: false` rejects addresses that have no auth.users row.
  if (
    code === "otp_disabled" ||
    code === "signup_disabled" ||
    code === "user_not_found" ||
    message.includes("signups not allowed") ||
    message.includes("signup is disabled") ||
    message.includes("user not found")
  ) {
    return AUTH_MSG.unknownEmail;
  }

  if (context === "verify") {
    if (
      code === "otp_expired" ||
      status === 401 ||
      status === 403 ||
      message.includes("expired") ||
      message.includes("invalid") ||
      message.includes("token")
    ) {
      return AUTH_MSG.badCode;
    }
  }

  return AUTH_MSG.generic;
}
