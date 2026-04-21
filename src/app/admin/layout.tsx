"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

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
        <main style={{ padding: "80px 24px", textAlign: "center", color: "#A09A8E" }}>
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
          background: "#EDE9E0",
          borderBottom: "1px solid #E8E4DB",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#7A756B",
              }}
            >
              Admin
            </span>
            {email && (
              <span style={{ fontSize: 13, color: "#2C2A25" }}>
                signed in as {email}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/"
              style={{
                fontSize: 13,
                color: "#2C2A25",
                textDecoration: "none",
                padding: "6px 10px",
                borderRadius: 6,
              }}
            >
              View site
            </Link>
            <button
              type="button"
              onClick={signOut}
              style={{
                fontSize: 13,
                color: "#C45D3E",
                fontWeight: 600,
                background: "transparent",
                border: "1px solid #E8E4DB",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
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
