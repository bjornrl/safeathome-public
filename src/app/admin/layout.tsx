"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authed" | "anon">("checking");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setStatus("authed");
        setEmail(data.session.user.email ?? null);
      } else {
        setStatus("anon");
        router.replace("/auth");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStatus("authed");
        setEmail(session.user.email ?? null);
      } else {
        setStatus("anon");
        router.replace("/auth");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (status === "checking") {
    return (
      <>
        <Nav />
        <main style={{ padding: "80px 24px", textAlign: "center", color: "#808080", fontFamily: FONT_STACK }}>
          Checking session…
        </main>
      </>
    );
  }

  if (status !== "authed") {
    return null;
  }

  return (
    <>
      <Nav />
      <div
        style={{
          background: "#f2f2f2",
          borderBottom: "1px solid #e6e6e6",
          fontFamily: FONT_STACK,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#808080",
              }}
            >
              Admin
            </span>
            {email && (
              <span style={{ fontSize: 13, color: "#2c2c2c" }}>
                signed in as {email}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/"
              style={{
                fontSize: 13,
                color: "#2c2c2c",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              View site
            </Link>
            <button
              type="button"
              onClick={signOut}
              style={{
                fontSize: 13,
                color: "#2a2859",
                fontWeight: 600,
                background: "#ffffff",
                border: "1px solid #2a2859",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: FONT_STACK,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
