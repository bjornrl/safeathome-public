import type { AuthError } from "@supabase/supabase-js";
import { fill } from "@/lib/i18n/dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries/no";

/**
 * Auth copy resolution, in one place so /login and /auth/reset never drift
 * apart — and so no raw English Supabase string reaches a user. The wording
 * itself lives in the locale dictionaries under `auth`.
 */

/**
 * Må matche «Email OTP Length» i Supabase-dashboardet. Alt i grensesnittet —
 * placeholder, `maxLength`, `pattern` og feilmeldingen — utledes herfra, så en
 * framtidig endring i dashboardet krever bare at dette tallet følger etter.
 */
export const CODE_LENGTH = 8;

export type AuthMessages = Dictionary["auth"];

/** The one message that interpolates: «Koden er 8 siffer.» */
export function shortCodeMessage(messages: AuthMessages): string {
  return fill(messages.shortCode, { n: CODE_LENGTH });
}

/**
 * `context` disambiguates errors that share wording across flows: the same
 * "invalid" means «unknown address» when requesting a code, «wrong code» when
 * verifying one, and «expired recovery session» when setting a new password.
 */
export type AuthContext = "send" | "verify" | "password";

export function authErrorMessage(
  err: AuthError | null,
  context: AuthContext,
  messages: AuthMessages,
): string {
  if (!err) return messages.generic;

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
    return messages.rateLimit;
  }

  if (context === "password") {
    if (code === "same_password" || message.includes("should be different")) {
      return messages.samePassword;
    }
    if (code === "weak_password" || message.includes("password should be")) {
      return messages.weakPassword;
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
      return messages.recoveryExpired;
    }
    return messages.generic;
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
    return messages.unknownEmail;
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
      return messages.badCode;
    }
  }

  return messages.generic;
}
