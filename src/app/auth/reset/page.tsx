"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

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
          Reset password
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
          Choose a new password.
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
              gap: 14,
              padding: 24,
              background: "#fff",
              border: "1px solid #E8E4DB",
              borderRadius: 14,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#7A756B" }}>
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
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#7A756B" }}>
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
              {submitting ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, fontSize: 13, color: "#A09A8E", lineHeight: 1.6 }}>
          <Link href="/auth" style={{ color: "#C45D3E" }}>
            Back to sign in
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
