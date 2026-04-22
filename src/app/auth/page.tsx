"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) router.replace("/admin");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    router.replace("/admin");
  }

  async function onMagicLink() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setSubmitting(true);
    const { error: signErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined,
      },
    });
    setSubmitting(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    setNotice(
      "Check your email for a sign-in link. You can close this tab while you wait.",
    );
  }

  async function onForgotPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/auth/reset` : undefined,
    });
    setSubmitting(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setNotice("Check your email for a password reset link.");
  }

  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 440,
          margin: "0 auto",
          padding: "80px 24px 96px",
          fontFamily: FONT_STACK,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "#808080",
            marginBottom: 16,
          }}
        >
          Project team sign in
        </p>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#2a2859",
            marginBottom: 16,
          }}
        >
          Log in to post insights.
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: "#666666",
            marginBottom: 32,
          }}
        >
          Members of the safe@home research group sign in here to publish
          stories, design responses, and resources.
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 24,
            background: "#ffffff",
            border: "1px solid #e6e6e6",
            borderRadius: 8,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2c" }}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@safeathome.research"
              style={inputStyle}
              autoComplete="email"
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2c" }}>Password</span>
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
                fontSize: 13,
                color: "#a83f34",
                background: "#fff2f1",
                border: "1px solid #ffdfdc",
                padding: "8px 16px",
                borderRadius: 4,
              }}
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              style={{
                fontSize: 13,
                color: "#034b45",
                background: "#c7fde9",
                border: "1px solid #43f8b6",
                padding: "8px 16px",
                borderRadius: 4,
              }}
            >
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 16px",
              background: "#2a2859",
              color: "#ffffff",
              borderRadius: 8,
              border: "1px solid #2a2859",
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
              fontFamily: FONT_STACK,
            }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={onMagicLink}
            disabled={submitting}
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: "#2a2859",
              borderRadius: 8,
              border: "1px solid #2a2859",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: FONT_STACK,
            }}
          >
            Email me a magic link instead
          </button>

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={submitting}
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: "#666666",
              borderRadius: 8,
              border: "1px solid #e6e6e6",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: FONT_STACK,
            }}
          >
            Forgot password?
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 13, color: "#808080", lineHeight: 1.6 }}>
          Accounts are managed by the research leads in the Supabase project.{" "}
          <Link href="/" style={{ color: "#1f42aa", fontWeight: 500 }}>
            Return to the homepage
          </Link>
          .
        </p>
      </main>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #e6e6e6",
  borderRadius: 8,
  fontSize: 15,
  fontFamily: FONT_STACK,
  background: "#ffffff",
  color: "#2c2c2c",
};
