"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type NavVariant = "default" | "minimal";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/explore", label: "Explore" },
  { href: "/frictions", label: "Frictions" },
  { href: "/qualities", label: "Qualities" },
  { href: "/solutions", label: "Solutions" },
  { href: "/reading-room", label: "Reading Room" },
  { href: "/for-municipalities", label: "For Municipalities" },
  { href: "/about", label: "About" },
];

function useAuthState() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return signedIn;
}

export default function Nav({ variant = "default" }: { variant?: NavVariant }) {
  const signedIn = useAuthState();
  const authHref = signedIn ? "/admin" : "/auth";
  const authLabel = signedIn ? "Admin" : "Log in";

  if (variant === "minimal") {
    return (
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
          fontFamily: "var(--font-dm-sans)",
          gap: 8,
        }}
      >
        <Link
          href="/"
          style={{
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "rgba(255,255,255,.95)",
            borderRadius: 8,
            border: "1px solid #E8E4DB",
            fontSize: 14,
            fontWeight: 600,
            color: "#2C2A25",
            textDecoration: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,.08)",
          }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>←</span>
          <span style={{ fontFamily: "var(--font-source-serif)", fontWeight: 700 }}>safe@home</span>
        </Link>

        <Link
          href={authHref}
          style={{
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 14px",
            background: "rgba(255,255,255,.95)",
            borderRadius: 8,
            border: "1px solid #E8E4DB",
            fontSize: 13,
            fontWeight: 600,
            color: signedIn ? "#C45D3E" : "#2C2A25",
            textDecoration: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,.08)",
          }}
        >
          {authLabel}
        </Link>
      </header>
    );
  }

  return (
    <header
      style={{
        borderBottom: "1px solid #E8E4DB",
        background: "rgba(247,245,240,.85)",
        backdropFilter: "saturate(140%) blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-source-serif)",
            fontSize: 20,
            fontWeight: 700,
            color: "#2C2A25",
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          safe@home
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "8px 12px",
                fontSize: 14,
                fontWeight: 500,
                color: "#2C2A25",
                textDecoration: "none",
                borderRadius: 6,
              }}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href={authHref}
            style={{
              marginLeft: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: signedIn ? "#fff" : "#2C2A25",
              background: signedIn ? "#C45D3E" : "transparent",
              border: `1px solid ${signedIn ? "#C45D3E" : "#E8E4DB"}`,
              textDecoration: "none",
              borderRadius: 8,
            }}
          >
            {authLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
