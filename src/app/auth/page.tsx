"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

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
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "#A09A8E",
            marginBottom: 12,
          }}
        >
          Project team sign in
        </p>
        <h1
          style={{
            fontFamily: "var(--font-source-serif)",
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#2C2A25",
            marginBottom: 14,
          }}
        >
          Log in to post insights.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-source-serif)",
            fontSize: 17,
            lineHeight: 1.6,
            color: "#7A756B",
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
            gap: 14,
            padding: 24,
            background: "#fff",
            border: "1px solid #E8E4DB",
            borderRadius: 14,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#7A756B" }}>Email</span>
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
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#7A756B" }}>Password</span>
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
                color: "#D14343",
                background: "#D1434312",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              style={{
                fontSize: 13,
                color: "#3A8A7D",
                background: "#3A8A7D12",
                padding: "8px 12px",
                borderRadius: 8,
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
              background: "#C45D3E",
              color: "#fff",
              borderRadius: 10,
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={onMagicLink}
            disabled={submitting}
            style={{
              padding: "10px 12px",
              background: "transparent",
              color: "#2C2A25",
              borderRadius: 8,
              border: "1px solid #E8E4DB",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Email me a magic link instead
          </button>

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={submitting}
            style={{
              padding: "10px 12px",
              background: "transparent",
              color: "#7A756B",
              borderRadius: 8,
              border: "1px solid #E8E4DB",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Forgot password?
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 13, color: "#A09A8E", lineHeight: 1.6 }}>
          Accounts are managed by the research leads in the Supabase project.{" "}
          <Link href="/" style={{ color: "#C45D3E" }}>
            Return to the homepage
          </Link>
          .
        </p>
      </main>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #E8E4DB",
  borderRadius: 8,
  fontSize: 15,
  fontFamily: "var(--font-dm-sans)",
  background: "#F7F5F0",
  color: "#2C2A25",
};
