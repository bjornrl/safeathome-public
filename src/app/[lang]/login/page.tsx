"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CODE_LENGTH, authErrorMessage, shortCodeMessage } from "@/lib/auth-messages";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { fill } from "@/lib/i18n/dictionary";


const SAFE_REDIRECT = /^\/(?!\/)/;

/** Seconds the «Send ny kode»-button stays disabled after a code is sent. */
const RESEND_SECONDS = 60;

// Lander på /internal, ikke /admin: redigeringsverktøyet er en handling, ikke
// et sted man bor (prompt 03, punkt 2). `fallback` already carries the locale.
function safeRedirect(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!SAFE_REDIRECT.test(raw)) return fallback;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, href } = useI18n();
  const MSG = t.auth;
  const target = safeRedirect(params.get("redirect"), href("/internal"));

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
    [router, target, MSG.noProfile],
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
      setError(authErrorMessage(sendErr, "send", MSG));
      return;
    }

    setEmail(address);
    setStep("code");
    setCode("");
    setCooldown(RESEND_SECONDS);
    // The first send needs no notice — the whole step changes, and the intro
    // paragraph already states that a code was sent. A resend looks identical,
    // so that one does need confirmation.
    setNotice(isResend ? t.login.resendNotice : null);
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
      setError(shortCodeMessage(MSG));
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
      setError(authErrorMessage(verifyErr, "verify", MSG));
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
          ? MSG.wrongPassword
          : authErrorMessage(signErr, "verify", MSG),
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
          ? `${window.location.origin}${href("/auth/reset")}`
          : undefined,
    });
    setSubmitting(false);

    if (resetErr) {
      setError(authErrorMessage(resetErr, "send", MSG));
      return;
    }
    setNotice(t.login.resetSent);
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
        {/* This page renders no Nav, so the switcher has to live here — it is a
            public entry point and must be reachable in both languages. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: space.s16,
            marginBottom: space.s32,
          }}
        >
          <Link
            href={href("/")}
            style={{
              ...typography.sizes.t14,
              color: colors.textMuted,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: space.s4,
            }}
          >
            <span aria-hidden>←</span> {t.login.backToHome}
          </Link>
          <LanguageSwitcher />
        </div>

        <p
          className="pkt-eyebrow"
          // `.pkt-eyebrow` is inline-block site-wide, which pulls the eyebrow up
          // onto the back-link's line. Overridden here rather than in globals.css
          // so the public pages keep the shared rule.
          style={{ display: "block", color: colors.textMuted, marginBottom: space.s16 }}
        >
          {t.login.eyebrow}
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
          {t.login.heading}
        </h1>
        <p
          style={{
            ...typography.sizes.t16,
            color: colors.textMuted,
            marginBottom: space.s32,
          }}
        >
          {showCodeStep
            ? fill(t.login.codeIntro, { n: CODE_LENGTH, email })
            : t.login.intro}
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
              <span style={labelStyle}>{t.login.emailLabel}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.login.emailPlaceholder}
                style={inputStyle}
                autoComplete="email"
                autoFocus
              />
            </label>
          )}

          {mode === "password" && (
            <label style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
              <span style={labelStyle}>{t.login.passwordLabel}</span>
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
              <span style={labelStyle}>{t.login.codeLabel}</span>
              <input
                ref={codeInputRef}
                type="text"
                required
                value={code}
                // Strip everything but digits so a pasted "123 456" still works.
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
                }
                placeholder={"0".repeat(CODE_LENGTH)}
                style={{ ...inputStyle, letterSpacing: "0.4em", fontSize: 20 }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                pattern={`\\d{${CODE_LENGTH}}`}
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
                ? t.login.submitPasswordBusy
                : t.login.submitPassword
              : step === "email"
                ? submitting
                  ? t.login.submitEmailBusy
                  : t.login.submitEmail
                : submitting
                  ? t.login.submitCodeBusy
                  : t.login.submitCode}
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
                {cooldown > 0 ? fill(t.login.resendCooldown, { s: cooldown }) : t.login.resend}
              </button>

              <button
                type="button"
                onClick={changeEmail}
                disabled={submitting}
                style={{ ...linkButtonStyle, cursor: "pointer" }}
              >
                {t.login.changeEmail}
              </button>

              <p
                style={{
                  ...typography.sizes.t14,
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                {t.login.noCodeHelp}
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
              {t.login.forgotPassword}
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
              {t.login.switchToPassword}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode("otp")}
              style={{ ...linkButtonStyle, padding: 0, cursor: "pointer" }}
            >
              {t.login.switchToCode}
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
          {t.login.accountsNote}{" "}
          <Link
            href={href("/")}
            style={{ color: colors.brandWarmBlue, fontWeight: typography.weights.medium }}
          >
            {t.login.backToHome}
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
  const { t } = useI18n();
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
          {t.common.loading}
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
