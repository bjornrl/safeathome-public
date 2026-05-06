"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

const SAFE_REDIRECT = /^\/(?!\/)/;

function safeRedirect(raw: string | null): string {
  if (!raw) return "/admin";
  if (!SAFE_REDIRECT.test(raw)) return "/admin";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const target = safeRedirect(params.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) router.replace(target);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) router.replace(target);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, target]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    router.replace(target);
  }

  async function onMagicLink() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Skriv inn e-postadressen din først.");
      return;
    }
    setSubmitting(true);
    const { error: signErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login?redirect=${encodeURIComponent(target)}`
            : undefined,
      },
    });
    setSubmitting(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    setNotice("Sjekk e-posten — vi har sendt en innloggingslenke.");
  }

  async function onForgotPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Skriv inn e-postadressen din først.");
      return;
    }
    setSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset`
          : undefined,
    });
    setSubmitting(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setNotice("Sjekk e-posten — vi har sendt en lenke for å sette nytt passord.");
  }

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
          style={{ color: colors.textMuted, marginBottom: space.s16 }}
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
          Medlemmer av SAFE@HOME-forskningsgruppen logger inn her for å publisere historier,
          designforslag og ressurser.
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: space.s16,
            padding: space.s24,
            background: colors.bgCard,
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
            <span style={{ ...typography.sizes.t12, fontWeight: typography.weights.medium, color: colors.textBody }}>
              E-post
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@oslomet.no"
              style={inputStyle}
              autoComplete="email"
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
            <span style={{ ...typography.sizes.t12, fontWeight: typography.weights.medium, color: colors.textBody }}>
              Passord
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p
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
              ...typography.sizes.t16,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
              fontFamily: FONT_STACK,
              padding: `${space.s12} ${space.s16}`,
              background: colors.brandWarmBlue,
              color: colors.textLight,
              border: `1px solid ${colors.brandWarmBlue}`,
              fontWeight: typography.weights.medium,
            }}
          >
            {submitting ? "Logger inn…" : "Logg inn"}
          </button>

          <button
            type="button"
            onClick={onMagicLink}
            disabled={submitting}
            style={{
              ...typography.sizes.t14,
              fontFamily: FONT_STACK,
              padding: `${space.s8} ${space.s16}`,
              background: "transparent",
              color: colors.brandWarmBlue,
              border: `1px solid ${colors.brandWarmBlue}`,
              fontWeight: typography.weights.medium,
              cursor: "pointer",
            }}
          >
            Send meg en innloggingslenke
          </button>

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={submitting}
            style={{
              ...typography.sizes.t14,
              fontFamily: FONT_STACK,
              padding: `${space.s8} ${space.s16}`,
              background: "transparent",
              color: colors.textMuted,
              border: `1px solid ${colors.borderSubtle}`,
              fontWeight: typography.weights.medium,
              cursor: "pointer",
            }}
          >
            Glemt passord?
          </button>
        </form>

        <p
          style={{
            marginTop: space.s24,
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

const inputStyle: React.CSSProperties = {
  padding: `${space.s12} ${space.s16}`,
  border: `1px solid ${colors.borderSubtle}`,
  fontSize: 15,
  fontFamily: FONT_STACK,
  background: colors.bgCard,
  color: colors.textBody,
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
