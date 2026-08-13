"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

const SAFE_REDIRECT = /^\/(?!\/)/;

/** Seconds the «Send ny kode»-button stays disabled after a code is sent. */
const RESEND_SECONDS = 60;

const CODE_LENGTH = 6;

const MSG = {
  unknownEmail:
    "Vi fant ingen bruker med denne adressen. Ta kontakt med prosjektadministrator for tilgang.",
  badCode: "Koden er feil eller utløpt. Be om en ny kode.",
  rateLimit: "Du har bedt om for mange koder. Vent noen minutter og prøv igjen.",
  generic: "Noe gikk galt. Prøv igjen om litt.",
  noProfile:
    "Kontoen mangler en profil på plattformen. Ta kontakt med prosjektadministrator.",
  missingEmail: "Skriv inn e-postadressen din først.",
  shortCode: `Koden er ${CODE_LENGTH} siffer.`,
} as const;

function safeRedirect(raw: string | null): string {
  if (!raw) return "/admin";
  if (!SAFE_REDIRECT.test(raw)) return "/admin";
  return raw;
}

/**
 * Supabase error text is English and leaks implementation detail, so every
 * failure is mapped to one of the four messages the team agreed on.
 * `context` matters: the same "invalid" wording means «unknown address» when
 * requesting a code and «wrong code» when verifying one.
 */
function authErrorMessage(
  err: AuthError | null,
  context: "send" | "verify",
): string {
  if (!err) return MSG.generic;

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
    return MSG.rateLimit;
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
    return MSG.unknownEmail;
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
      return MSG.badCode;
    }
  }

  return MSG.generic;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const target = safeRedirect(params.get("redirect"));

  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [step, setStep] = useState<"email" | "code">("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // An already-signed-in visitor never needs the form. Redirects that follow a
  // *successful* sign-in are issued explicitly below, after the profile check —
  // an onAuthStateChange redirect would race that check and let a user without
  // a `profiles` row through.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) router.replace(target);
    });
    return () => {
      active = false;
    };
  }, [router, target]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /**
   * The session alone is not enough: the internal platform is invite-only and
   * every member is expected to have a `profiles` row. A session without one is
   * signed straight back out rather than left half-authenticated.
   */
  const enterPlatform = useCallback(
    async (userId: string): Promise<boolean> => {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        setError(MSG.noProfile);
        return false;
      }

      router.replace(target);
      return true;
    },
    [router, target],
  );

  async function sendCode(isResend: boolean) {
    setError(null);
    setNotice(null);

    const address = email.trim();
    if (!address) {
      setError(MSG.missingEmail);
      return;
    }

    setSubmitting(true);
    const { error: sendErr } = await supabase.auth.signInWithOtp({
      email: address,
      // Invite-only platform: never let an unknown address create an account.
      options: { shouldCreateUser: false },
    });
    setSubmitting(false);

    if (sendErr) {
      setError(authErrorMessage(sendErr, "send"));
      return;
    }

    setEmail(address);
    setStep("code");
    setCode("");
    setCooldown(RESEND_SECONDS);
    // The first send needs no notice — the whole step changes, and the intro
    // paragraph already states that a code was sent. A resend looks identical,
    // so that one does need confirmation.
    setNotice(isResend ? "Ny kode sendt. Bruk den nyeste koden i innboksen." : null);
  }

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    await sendCode(false);
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (code.length !== CODE_LENGTH) {
      setError(MSG.shortCode);
      return;
    }

    setSubmitting(true);
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email",
    });

    if (verifyErr || !data.user) {
      setSubmitting(false);
      setError(authErrorMessage(verifyErr, "verify"));
      setCode("");
      codeInputRef.current?.focus();
      return;
    }

    const entered = await enterPlatform(data.user.id);
    if (!entered) {
      setSubmitting(false);
      setStep("email");
      setCode("");
    }
  }

  async function onSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    const { data, error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signErr || !data.user) {
      setSubmitting(false);
      setError(
        signErr?.status === 400
          ? "Feil e-postadresse eller passord."
          : authErrorMessage(signErr, "verify"),
      );
      return;
    }

    const entered = await enterPlatform(data.user.id);
    if (!entered) setSubmitting(false);
  }

  async function onForgotPassword() {
    setError(null);
    setNotice(null);

    const address = email.trim();
    if (!address) {
      setError(MSG.missingEmail);
      return;
    }

    setSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset`
          : undefined,
    });
    setSubmitting(false);

    if (resetErr) {
      setError(authErrorMessage(resetErr, "send"));
      return;
    }
    setNotice("Sjekk e-posten — vi har sendt en lenke for å sette nytt passord.");
  }

  function changeEmail() {
    setStep("email");
    setCode("");
    setError(null);
    setNotice(null);
  }

  function switchMode(next: "otp" | "password") {
    setMode(next);
    setStep("email");
    setCode("");
    setPassword("");
    setError(null);
    setNotice(null);
  }

  const showCodeStep = mode === "otp" && step === "code";

  return (
    <main
      style={{
        fontFamily: FONT_STACK,
        background: colors.bg,
        minHeight: "100vh",
        padding: `${space.s64} ${space.s24} ${space.s104}`,
      }}
    >
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            ...typography.sizes.t14,
            color: colors.textMuted,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: space.s4,
            marginBottom: space.s32,
          }}
        >
          <span aria-hidden>←</span> Tilbake til forsiden
        </Link>

        <p
          className="pkt-eyebrow"
          // `.pkt-eyebrow` is inline-block site-wide, which pulls the eyebrow up
          // onto the back-link's line. Overridden here rather than in globals.css
          // so the public pages keep the shared rule.
          style={{ display: "block", color: colors.textMuted, marginBottom: space.s16 }}
        >
          Innlogging for prosjektgruppen
        </p>
        <h1
          style={{
            ...typography.sizes.t40,
            fontWeight: typography.weights.bold,
            color: colors.textBody,
            marginBottom: space.s16,
            letterSpacing: "-0.02em",
          }}
        >
          Logg inn for å publisere innsikter.
        </h1>
        <p
          style={{
            ...typography.sizes.t16,
            color: colors.textMuted,
            marginBottom: space.s32,
          }}
        >
          {showCodeStep
            ? `Vi har sendt en engangskode på ${CODE_LENGTH} siffer til ${email}. Koden er gyldig i kort tid — sjekk også søppelpost hvis den ikke dukker opp.`
            : "Medlemmer av SAFE@HOME-forskningsgruppen logger inn her for å publisere historier, designforslag og ressurser."}
        </p>

        <form
          onSubmit={
            mode === "password"
              ? onSubmitPassword
              : step === "email"
                ? onSubmitEmail
                : onSubmitCode
          }
          style={{
            display: "flex",
            flexDirection: "column",
            gap: space.s16,
            padding: space.s24,
            background: colors.bgCard,
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          {!showCodeStep && (
            <label style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
              <span style={labelStyle}>E-post</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="navn@oslomet.no"
                style={inputStyle}
                autoComplete="email"
                autoFocus
              />
            </label>
          )}

          {mode === "password" && (
            <label style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
              <span style={labelStyle}>Passord</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                autoComplete="current-password"
              />
            </label>
          )}

          {showCodeStep && (
            <label style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
              <span style={labelStyle}>Engangskode</span>
              <input
                ref={codeInputRef}
                type="text"
                required
                value={code}
                // Strip everything but digits so a pasted "123 456" still works.
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
                }
                placeholder="000000"
                style={{ ...inputStyle, letterSpacing: "0.4em", fontSize: 20 }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                pattern="\d{6}"
                autoFocus
              />
            </label>
          )}

          {error && (
            <p
              role="alert"
              style={{
                ...typography.sizes.t14,
                color: "#a83f34",
                background: "#fff2f1",
                border: "1px solid #ffdfdc",
                padding: `${space.s8} ${space.s16}`,
              }}
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              style={{
                ...typography.sizes.t14,
                color: "#034b45",
                background: "#c7fde9",
                border: "1px solid #43f8b6",
                padding: `${space.s8} ${space.s16}`,
              }}
            >
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...primaryButtonStyle,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {mode === "password"
              ? submitting
                ? "Logger inn…"
                : "Logg inn"
              : step === "email"
                ? submitting
                  ? "Sender kode…"
                  : "Send meg en engangskode"
                : submitting
                  ? "Logger inn…"
                  : "Logg inn"}
          </button>

          {showCodeStep && (
            <>
              <button
                type="button"
                onClick={() => sendCode(true)}
                disabled={submitting || cooldown > 0}
                style={{
                  ...secondaryButtonStyle,
                  cursor: submitting || cooldown > 0 ? "not-allowed" : "pointer",
                  opacity: submitting || cooldown > 0 ? 0.6 : 1,
                }}
              >
                {cooldown > 0 ? `Send ny kode (${cooldown} s)` : "Send ny kode"}
              </button>

              <button
                type="button"
                onClick={changeEmail}
                disabled={submitting}
                style={{ ...linkButtonStyle, cursor: "pointer" }}
              >
                Endre e-postadresse
              </button>

              <p
                style={{
                  ...typography.sizes.t14,
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                Får du ingen kode? Adressen må være registrert på forhånd — ta kontakt
                med prosjektadministrator hvis den ikke kommer.
              </p>
            </>
          )}

          {mode === "password" && (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={submitting}
              style={{
                ...secondaryButtonStyle,
                color: colors.textMuted,
                border: `1px solid ${colors.borderSubtle}`,
                cursor: "pointer",
              }}
            >
              Glemt passord?
            </button>
          )}
        </form>

        <p
          style={{
            marginTop: space.s24,
            ...typography.sizes.t14,
            color: colors.textMuted,
          }}
        >
          {mode === "otp" ? (
            <button
              type="button"
              onClick={() => switchMode("password")}
              style={{ ...linkButtonStyle, padding: 0, cursor: "pointer" }}
            >
              Logg inn med passord i stedet
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode("otp")}
              style={{ ...linkButtonStyle, padding: 0, cursor: "pointer" }}
            >
              Logg inn med engangskode i stedet
            </button>
          )}
        </p>

        <p
          style={{
            marginTop: space.s16,
            ...typography.sizes.t14,
            color: colors.textMuted,
          }}
        >
          Kontoer administreres av forskningslederne i Supabase.{" "}
          <Link
            href="/"
            style={{ color: colors.brandWarmBlue, fontWeight: typography.weights.medium }}
          >
            Tilbake til forsiden
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  ...typography.sizes.t12,
  fontWeight: typography.weights.medium,
  color: colors.textBody,
};

const inputStyle: React.CSSProperties = {
  padding: `${space.s12} ${space.s16}`,
  border: `1px solid ${colors.borderSubtle}`,
  fontSize: 15,
  fontFamily: FONT_STACK,
  background: colors.bgCard,
  color: colors.textBody,
};

const primaryButtonStyle: React.CSSProperties = {
  ...typography.sizes.t16,
  fontFamily: FONT_STACK,
  padding: `${space.s12} ${space.s16}`,
  background: colors.brandWarmBlue,
  color: colors.textLight,
  border: `1px solid ${colors.brandWarmBlue}`,
  fontWeight: typography.weights.medium,
};

const secondaryButtonStyle: React.CSSProperties = {
  ...typography.sizes.t14,
  fontFamily: FONT_STACK,
  padding: `${space.s8} ${space.s16}`,
  background: "transparent",
  color: colors.brandWarmBlue,
  border: `1px solid ${colors.brandWarmBlue}`,
  fontWeight: typography.weights.medium,
};

const linkButtonStyle: React.CSSProperties = {
  ...typography.sizes.t14,
  fontFamily: FONT_STACK,
  padding: `${space.s8} ${space.s16}`,
  background: "transparent",
  color: colors.brandWarmBlue,
  border: "none",
  fontWeight: typography.weights.medium,
  textDecoration: "underline",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            fontFamily: FONT_STACK,
            padding: `${space.s64} ${space.s24}`,
            textAlign: "center",
            color: colors.textMuted,
          }}
        >
          Laster…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
