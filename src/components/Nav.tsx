"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, motion, space, typography } from "@/lib/design-tokens";
import { Button } from "@/components/ui";

export type NavVariant = "default" | "minimal";
export type NavMode = "public" | "internal";

const PUBLIC_LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "Om" },
  { href: "/reading-room", label: "Lesesal" },
];

const INTERNAL_LINKS: { href: string; label: string }[] = [
  { href: "/admin", label: "Content editor" },
  { href: "/welfare-tech", label: "Velferdsteknologi" },
  { href: "/internal/nodes", label: "Node map" },
  { href: "/explore", label: "Utforsk" },
  { href: "/frictions", label: "Friksjoner" },
  { href: "/qualities", label: "Kvaliteter" },
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
  const path = href.split("?")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

export default function Nav({
  variant = "default",
  mode = "public",
}: {
  variant?: NavVariant;
  mode?: NavMode;
}) {
  const signedIn = useAuthState();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape + click outside.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (
        target &&
        !menuRef.current?.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  // Close the menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const homeHref = signedIn ? "/admin" : "/";

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
          href={homeHref}
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
          {signedIn ? (
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="sm">Admin</Button>
            </Link>
          ) : (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="sm">Team login</Button>
            </Link>
          )}
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
          position: "relative",
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
          href={homeHref}
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

        {mode === "internal" || signedIn ? (
          <InternalNavRow
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            toggleRef={toggleRef}
          />
        ) : (
          <PublicNavRow pathname={pathname} signedIn={signedIn} />
        )}

        {(mode === "internal" || signedIn) && menuOpen && (
          <DropdownMenu menuRef={menuRef} pathname={pathname} />
        )}
      </div>
    </header>
  );
}

// ─── Public nav (kept inline) ───

function PublicNavRow({
  pathname,
  signedIn,
}: {
  pathname: string | null;
  signedIn: boolean | null;
}) {
  return (
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
        {PUBLIC_LINKS.map((link) => {
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

      {signedIn ? (
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="sm">Admin</Button>
        </Link>
      ) : (
        <Link
          href="/login"
          style={{
            ...typography.sizes.t14,
            fontWeight: typography.weights.medium,
            color: colors.textMuted,
            textDecoration: "none",
            borderBottom: `1px dashed ${colors.borderSubtle}`,
            paddingBottom: "2px",
            transition: `color ${motion.fast}, border-color ${motion.fast}`,
          }}
        >
          Team login →
        </Link>
      )}
    </nav>
  );
}

// ─── Internal nav (hamburger only) ───

function InternalNavRow({
  menuOpen,
  setMenuOpen,
  toggleRef,
}: {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  toggleRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={toggleRef}
      type="button"
      aria-label={menuOpen ? "Lukk meny" : "Åpne meny"}
      aria-expanded={menuOpen}
      aria-haspopup="true"
      onClick={() => setMenuOpen(!menuOpen)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: space.s8,
        padding: `${space.s8} ${space.s12}`,
        background: menuOpen ? colors.brandDarkBlue : colors.bgCard,
        color: menuOpen ? colors.textLight : colors.textBody,
        border: `1px solid ${menuOpen ? colors.brandDarkBlue : colors.borderSubtle}`,
        cursor: "pointer",
        fontFamily: "var(--pkt-font-family)",
        ...typography.sizes.t14,
        fontWeight: typography.weights.medium,
        transition: `background ${motion.fast}, color ${motion.fast}, border-color ${motion.fast}`,
      }}
    >
      <HamburgerIcon open={menuOpen} />
      <span>{menuOpen ? "Lukk" : "Meny"}</span>
    </button>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  // Three horizontal bars; rotate to an X when open.
  const stroke = "currentColor";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden
      style={{ display: "block" }}
    >
      <line
        x1="2"
        y1={open ? "9" : "4"}
        x2="16"
        y2={open ? "9" : "4"}
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        transform={open ? "rotate(45 9 9)" : undefined}
      />
      <line
        x1="2"
        y1="9"
        x2="16"
        y2="9"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={open ? 0 : 1}
      />
      <line
        x1="2"
        y1={open ? "9" : "14"}
        x2="16"
        y2={open ? "9" : "14"}
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        transform={open ? "rotate(-45 9 9)" : undefined}
      />
    </svg>
  );
}

function DropdownMenu({
  menuRef,
  pathname,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>;
  pathname: string | null;
}) {
  const router = useRouter();
  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }
  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        right: space.s24,
        minWidth: 280,
        maxWidth: "calc(100vw - 48px)",
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        boxShadow: "0 8px 24px rgba(42, 40, 89, 0.12)",
        zIndex: 60,
        padding: space.s16,
        display: "flex",
        flexDirection: "column",
        gap: space.s16,
      }}
    >
      <MenuSection title="Internt" links={INTERNAL_LINKS} pathname={pathname} accent={colors.brandWarmBlue} />
      <div style={{ height: 1, background: colors.borderSubtle }} />
      <MenuSection title="Offentlige sider" links={PUBLIC_LINKS} pathname={pathname} accent={colors.brandDarkBlue} />
      <div style={{ height: 1, background: colors.borderSubtle }} />
      <button
        type="button"
        role="menuitem"
        onClick={signOut}
        style={{
          width: "100%",
          textAlign: "left",
          padding: `${space.s8} ${space.s12}`,
          ...typography.sizes.t14,
          fontWeight: typography.weights.medium,
          color: colors.brandWarmBlue,
          background: "transparent",
          border: "none",
          borderLeft: `2px solid transparent`,
          cursor: "pointer",
          fontFamily: "var(--pkt-font-family)",
        }}
      >
        Logg ut
      </button>
    </div>
  );
}

function MenuSection({
  title,
  links,
  pathname,
  accent,
}: {
  title: string;
  links: { href: string; label: string }[];
  pathname: string | null;
  accent: string;
}) {
  return (
    <div>
      <p
        style={{
          ...typography.sizes.t12,
          fontWeight: typography.weights.bold,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: colors.textMuted,
          marginBottom: space.s8,
        }}
      >
        {title}
      </p>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {links.map((link) => {
          const active = isLinkActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                role="menuitem"
                style={{
                  display: "block",
                  padding: `${space.s8} ${space.s12}`,
                  ...typography.sizes.t14,
                  fontWeight: active ? typography.weights.medium : typography.weights.regular,
                  color: active ? accent : colors.textBody,
                  textDecoration: "none",
                  background: active ? colors.bgSubtle : "transparent",
                  borderLeft: `2px solid ${active ? accent : "transparent"}`,
                  transition: `background ${motion.fast}, border-color ${motion.fast}`,
                }}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
