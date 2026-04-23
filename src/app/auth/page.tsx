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
    supabase.auth.getSession().then(({
      data
    }) => {
      if (data.session) router.replace("/admin");
    });
    const {
      data: sub
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) router.replace("/admin");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const {
      error: signErr
    } = await supabase.auth.signInWithPassword({
      email,
      password
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
    const {
      error: signErr
    } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined
      }
    });
    setSubmitting(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    setNotice("Check your email for a sign-in link. You can close this tab while you wait.");
  }
  async function onForgotPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setSubmitting(true);
    const {
      error: resetErr
    } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/reset` : undefined
    });
    setSubmitting(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setNotice("Check your email for a password reset link.");
  }
  return <>
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:440px] [margin:0_auto] [padding:80px_24px_96px]">
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
          Project team sign in
        </p>
        <h1 className="[font-size:40px] [font-weight:700] [line-height:1.1] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:16px]">
          Log in to post insights.
        </h1>
        <p className="[font-size:17px] [line-height:1.6] [color:#666666] [margin-bottom:32px]">
          Members of the safe@home research group sign in here to publish
          stories, design responses, and resources.
        </p>

        <form onSubmit={onSubmit} className="[display:flex] [flex-direction:column] [gap:16px] [padding:24px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px]">
          <label className="[display:flex] [flex-direction:column] [gap:8px]">
            <span className="[font-size:12px] [font-weight:600] [color:#2c2c2c]">Email</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@safeathome.research" style={inputStyle} autoComplete="email" />
          </label>
          <label className="[display:flex] [flex-direction:column] [gap:8px]">
            <span className="[font-size:12px] [font-weight:600] [color:#2c2c2c]">Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} autoComplete="current-password" />
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
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <button type="button" onClick={onMagicLink} disabled={submitting} style={{
          fontFamily: FONT_STACK
        }} className="[padding:10px_16px] [background:transparent] [color:#2a2859] [border-radius:8px] [border:1px_solid_#2a2859] [font-size:13px] [font-weight:500] [cursor:pointer]">
            Email me a magic link instead
          </button>

          <button type="button" onClick={onForgotPassword} disabled={submitting} style={{
          fontFamily: FONT_STACK
        }} className="[padding:10px_16px] [background:transparent] [color:#666666] [border-radius:8px] [border:1px_solid_#e6e6e6] [font-size:13px] [font-weight:500] [cursor:pointer]">
            Forgot password?
          </button>
        </form>

        <p className="[margin-top:24px] [font-size:13px] [color:#808080] [line-height:1.6]">
          Accounts are managed by the research leads in the Supabase project.{" "}
          <Link href="/" className="[color:#1f42aa] [font-weight:500]">
            Return to the homepage
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
