"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasRecovery, setHasRecovery] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasRecovery(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecovery(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setNotice("Password updated. Redirecting…");
    router.replace("/admin");
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
          Reset password
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
          Choose a new password.
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: "#666666",
            marginBottom: 32,
          }}
        >
          {hasRecovery === false
            ? "This link has expired or is missing a recovery session. Request a new reset link from the sign-in page."
            : "Set a password you'll remember. You'll be signed in automatically once it's saved."}
        </p>

        {hasRecovery !== false && (
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
              <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2c" }}>
                New password
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={inputStyle}
                autoComplete="new-password"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2c" }}>
                Confirm password
              </span>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
                autoComplete="new-password"
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
              {submitting ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, fontSize: 13, color: "#808080", lineHeight: 1.6 }}>
          <Link href="/auth" style={{ color: "#1f42aa", fontWeight: 500 }}>
            Back to sign in
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
