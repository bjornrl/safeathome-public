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
    supabase.auth.getSession().then(({
      data
    }) => {
      setHasRecovery(Boolean(data.session));
    });
    const {
      data: sub
    } = supabase.auth.onAuthStateChange((event, session) => {
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
    const {
      error: updateErr
    } = await supabase.auth.updateUser({
      password
    });
    setSubmitting(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setNotice("Password updated. Redirecting…");
    router.replace("/admin");
  }
  return <>
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:440px] [margin:0_auto] [padding:80px_24px_96px]">
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
          Reset password
        </p>
        <h1 className="[font-size:40px] [font-weight:700] [line-height:1.1] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:16px]">
          Choose a new password.
        </h1>
        <p className="[font-size:17px] [line-height:1.6] [color:#666666] [margin-bottom:32px]">
          {hasRecovery === false ? "This link has expired or is missing a recovery session. Request a new reset link from the sign-in page." : "Set a password you'll remember. You'll be signed in automatically once it's saved."}
        </p>

        {hasRecovery !== false && <form onSubmit={onSubmit} className="[display:flex] [flex-direction:column] [gap:16px] [padding:24px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px]">
            <label className="[display:flex] [flex-direction:column] [gap:8px]">
              <span className="[font-size:12px] [font-weight:600] [color:#2c2c2c]">
                New password
              </span>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} autoComplete="new-password" />
            </label>
            <label className="[display:flex] [flex-direction:column] [gap:8px]">
              <span className="[font-size:12px] [font-weight:600] [color:#2c2c2c]">
                Confirm password
              </span>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" />
            </label>

            {error && <p className="[font-size:13px] [color:#a83f34] [background:#fff2f1] [border:1px_solid_#ffdfdc] [padding:8px_16px] [border-radius:4px]">
                {error}
              </p>}

            {notice && <p className="[font-size:13px] [color:#034b45] [background:#c7fde9] [border:1px_solid_#43f8b6] [padding:8px_16px] [border-radius:4px]">
                {notice}
              </p>}

            <button type="submit" disabled={submitting} style={{
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
          fontFamily: FONT_STACK
        }} className="[padding:12px_16px] [background:#2a2859] [color:#ffffff] [border-radius:8px] [border:1px_solid_#2a2859] [font-size:15px] [font-weight:600]">
              {submitting ? "Saving…" : "Save new password"}
            </button>
          </form>}

        <p className="[margin-top:24px] [font-size:13px] [color:#808080] [line-height:1.6]">
          <Link href="/auth" className="[color:#1f42aa] [font-weight:500]">
            Back to sign in
          </Link>
          .
        </p>
      </main>
    </>;
}
const inputStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #e6e6e6",
  borderRadius: 8,
  fontSize: 15,
  fontFamily: FONT_STACK,
  background: "#ffffff",
  color: "#2c2c2c"
};
