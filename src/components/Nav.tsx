"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, motion, space, typography } from "@/lib/design-tokens";
import { Button } from "@/components/ui";

export type NavVariant = "default" | "minimal";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/explore", label: "Utforsk" },
  { href: "/index", label: "Register" },
  { href: "/frictions", label: "Friksjoner" },
  { href: "/qualities", label: "Kvaliteter" },
  { href: "/solutions", label: "Løsninger" },
  { href: "/reading-room", label: "Lesesal" },
  { href: "/for-municipalities", label: "For kommuner" },
  { href: "/about", label: "Om" },
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

function isLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Nav({ variant = "default" }: { variant?: NavVariant }) {
  const signedIn = useAuthState();
  const pathname = usePathname();
  const authHref = signedIn ? "/admin" : "/auth";
  const authLabel = signedIn ? "Admin" : "Logg inn";
  const [mobileOpen, setMobileOpen] = useState(false);

  if (variant === "minimal") {
    return (
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: space.s16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
          gap: space.s8,
        }}
      >
        <Link
          href="/"
          style={{
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: space.s8,
            padding: `${space.s8} ${space.s16}`,
            background: colors.bgCard,
            border: `1px solid ${colors.borderSubtle}`,
            fontSize: "14px",
            fontWeight: 600,
            color: colors.textBody,
            textDecoration: "none",
          }}
        >
          <span aria-hidden>←</span>
          <span style={{ fontWeight: 700 }}>safe@home</span>
        </Link>

        <div style={{ pointerEvents: "auto" }}>
          <Button
            variant={signedIn ? "primary" : "secondary"}
            size="sm"
            onClick={() => { window.location.href = authHref; }}
          >
            {authLabel}
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        background: colors.bgCard,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Utility row */}
      <div
        style={{
          borderBottom: `1px solid ${colors.borderSubtle}`,
          background: colors.bgSubtle,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: `${space.s8} ${space.s24}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: space.s16,
            ...typography.sizes.t12,
            color: colors.textMuted,
          }}
        >
          <span>Forskning · OsloMet, UiO, Durham, Comte</span>
        </div>
      </div>

      {/* Main nav row */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: `${space.s16} ${space.s24}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space.s24,
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "22px",
            lineHeight: "34px",
            fontWeight: 700,
            color: colors.textBody,
            textDecoration: "none",
            letterSpacing: "-0.2px",
          }}
        >
          safe@home
        </Link>

        <nav
          aria-label="Hovedmeny"
          style={{
            display: "flex",
            alignItems: "center",
            gap: space.s24,
            flexWrap: "wrap",
          }}
        >
          <ul
            className="pkt-main-nav-links"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: space.s24,
              flexWrap: "wrap",
            }}
          >
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    style={{
                      display: "inline-block",
                      fontSize: "16px",
                      lineHeight: "24px",
                      fontWeight: active ? 600 : 500,
                      color: active ? colors.brandWarmBlue : colors.textBody,
                      textDecoration: "none",
                      paddingBottom: "4px",
                      borderBottom: `2px solid ${active ? colors.brandWarmBlue : "transparent"}`,
                      transition: `color ${motion.fast}, border-color ${motion.fast}`,
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Button
            variant={signedIn ? "primary" : "secondary"}
            size="sm"
            onClick={() => { window.location.href = authHref; }}
          >
            {authLabel}
          </Button>

          <button
            type="button"
            aria-label="Meny"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(v => !v)}
            className="pkt-mobile-toggle"
            style={{
              display: "none",
              padding: space.s8,
              background: "transparent",
              border: `1px solid ${colors.borderGray}`,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {mobileOpen ? "Lukk" : "Meny"}
          </button>
        </nav>
      </div>

      {mobileOpen && (
        <div
          className="pkt-mobile-menu"
          style={{
            display: "none",
            borderTop: `1px solid ${colors.borderSubtle}`,
            padding: `${space.s16} ${space.s24}`,
          }}
        >
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s12 }}>
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    style={{
                      color: active ? colors.brandWarmBlue : colors.textBody,
                      textDecoration: "none",
                      fontSize: "16px",
                      fontWeight: active ? 600 : 500,
                      borderLeft: `2px solid ${active ? colors.brandWarmBlue : "transparent"}`,
                      paddingLeft: active ? space.s8 : 0,
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
