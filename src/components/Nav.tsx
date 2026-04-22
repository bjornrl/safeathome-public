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

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

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
          padding: "16px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
          fontFamily: FONT_STACK,
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
            padding: "8px 16px",
            background: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e6e6e6",
            fontSize: 14,
            fontWeight: 600,
            color: "#2a2859",
            textDecoration: "none",
          }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>←</span>
          <span style={{ fontWeight: 700 }}>safe@home</span>
        </Link>

        <Link
          href={authHref}
          style={{
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 16px",
            background: signedIn ? "#2a2859" : "#ffffff",
            borderRadius: 8,
            border: `1px solid ${signedIn ? "#2a2859" : "#e6e6e6"}`,
            fontSize: 13,
            fontWeight: 600,
            color: signedIn ? "#ffffff" : "#2c2c2c",
            textDecoration: "none",
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
        borderBottom: "1px solid #e6e6e6",
        background: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 50,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "16px 24px",
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
            fontSize: 20,
            fontWeight: 700,
            color: "#2a2859",
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
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: "#2c2c2c",
                textDecoration: "none",
                borderRadius: 4,
              }}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href={authHref}
            style={{
              marginLeft: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: signedIn ? "#ffffff" : "#2a2859",
              background: signedIn ? "#2a2859" : "transparent",
              border: `1px solid ${signedIn ? "#2a2859" : "#2a2859"}`,
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
