"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion as fm, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { EXPLORE_MAP_ENABLED } from "@/lib/feature-flags";
import { clay, colors, motion, space, typography } from "@/lib/design-tokens";
import { Button } from "@/components/ui";

export type NavVariant = "default" | "minimal";
export type NavMode = "public" | "internal";

type NavLink = { href: string; label: string; description: string };

const PUBLIC_LINKS: NavLink[] = [
  { href: "/about", label: "Om", description: "Om prosjektet safe@home og forskningen bak." },
  { href: "/reading-room", label: "Lesesal", description: "Offentlig samling av publikasjoner og ressurser." },
];

const INTERNAL_LINKS: NavLink[] = [
  { href: "/admin", label: "Innholdsredigering", description: "Skriv og rediger notater, innsikter, ressurser og mer." },
  { href: "/internal/search", label: "Søk", description: "Semantisk søk på tvers av hele korpuset." },
  { href: "/welfare-tech", label: "Velferdsteknologi", description: "Bla gjennom teknologi-oppføringer med detaljer." },
  { href: "/internal/nodes", label: "Nodekart", description: "Visuelt kart over koblinger mellom innholdet." },
  ...(EXPLORE_MAP_ENABLED ? [{ href: "/explore", label: "Utforsk", description: "Interaktivt kart over prosjektet." }] : []),
  { href: "/frictions", label: "Friksjoner", description: "Oversikt over friksjonskategoriene." },
  { href: "/qualities", label: "Kvaliteter", description: "Oversikt over kvalitetskategoriene." },
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
  const menuRef = useRef<HTMLElement | null>(null);
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
            background: clay.colors.canvas,
            border: `1px solid ${clay.colors.hairline}`,
            borderRadius: "var(--clay-radius-md)",
            fontFamily: clay.font.body,
            fontSize: "14px",
            fontWeight: 600,
            color: clay.colors.ink,
            textDecoration: "none",
            letterSpacing: "-0.2px",
          }}
        >
          <span aria-hidden>←</span>
          <span style={{ fontWeight: 600 }}>safe@home</span>
        </Link>

        <div style={{ pointerEvents: "auto" }}>
          {signedIn ? (
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="sm">Admin</Button>
            </Link>
          ) : (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="sm">Innlogging</Button>
            </Link>
          )}
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        background: clay.colors.canvas,
        borderBottom: `1px solid ${clay.colors.hairline}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Utility row */}
      <div
        style={{
          borderBottom: `1px solid ${clay.colors.hairline}`,
          background: clay.colors.surfaceSoft,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: `${space.s8} ${space.s24}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: space.s16,
            ...typography.sizes.t12,
            color: clay.colors.muted,
            fontFamily: clay.font.body,
          }}
        >
          <span>Forskning · OsloMet, UiO, Durham, Comte</span>
        </div>
      </div>

      {/* Main nav row */}
      <div
        style={{
          position: "relative",
          maxWidth: "1280px",
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
            fontFamily: clay.font.display,
            fontSize: "22px",
            lineHeight: 1.2,
            fontWeight: 500,
            color: clay.colors.ink,
            textDecoration: "none",
            letterSpacing: "-0.5px",
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

        <AnimatePresence>
          {(mode === "internal" || signedIn) && menuOpen && (
            <DropdownMenu key="menu" menuRef={menuRef} pathname={pathname} onClose={() => setMenuOpen(false)} />
          )}
        </AnimatePresence>
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
                  fontFamily: clay.font.body,
                  fontSize: "14px",
                  lineHeight: 1.4,
                  fontWeight: active ? 600 : 500,
                  color: active ? clay.colors.ink : clay.colors.body,
                  textDecoration: "none",
                  paddingBottom: "4px",
                  borderBottom: `2px solid ${active ? clay.colors.ink : "transparent"}`,
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
            fontFamily: clay.font.body,
            fontSize: "14px",
            fontWeight: 500,
            color: clay.colors.muted,
            textDecoration: "none",
            borderBottom: `1px dashed ${clay.colors.hairline}`,
            paddingBottom: "2px",
            transition: `color ${motion.fast}, border-color ${motion.fast}`,
          }}
        >
          Innlogging for teamet →
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
        background: menuOpen ? clay.colors.ink : clay.colors.canvas,
        color: menuOpen ? clay.colors.onPrimary : clay.colors.ink,
        border: `1px solid ${menuOpen ? clay.colors.ink : clay.colors.hairline}`,
        borderRadius: "var(--clay-radius-md)",
        cursor: "pointer",
        fontFamily: clay.font.body,
        ...typography.sizes.t14,
        fontWeight: 600,
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
  onClose,
}: {
  menuRef: React.RefObject<HTMLElement | null>;
  pathname: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }
  return (
    <>
      {/* Dimmed clickable overlay */}
      <fm.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(42, 40, 89, 0.35)",
          zIndex: 40,
        }}
      />

      {/* Full-height right drawer — mirrors the welfare-tech detail panel */}
      <fm.aside
        ref={menuRef}
        role="menu"
        aria-label="Meny"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: 460,
          maxWidth: "100vw",
          background: clay.colors.canvas,
          borderLeft: `1px solid ${clay.colors.hairline}`,
          boxShadow: "-12px 0 32px rgba(42, 40, 89, 0.12)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          fontFamily: clay.font.body,
        }}
      >
        {/* Header bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${space.s16} ${space.s24}`,
            borderBottom: `1px solid ${clay.colors.hairline}`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              ...typography.sizes.t12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: clay.colors.muted,
            }}
          >
            Meny
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk meny"
            style={{
              background: "transparent",
              border: "none",
              fontSize: 28,
              lineHeight: 1,
              cursor: "pointer",
              color: clay.colors.muted,
              fontFamily: clay.font.body,
              padding: 0,
            }}
          >
            ×
          </button>
        </header>

        {/* Body — fills the remaining screen height; contains its own content */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: space.s16,
            padding: space.s24,
          }}
        >
          <MenuSection title="Internt" links={INTERNAL_LINKS} pathname={pathname} />
          <div style={{ height: 1, background: clay.colors.hairline }} />
          <MenuSection title="Offentlige sider" links={PUBLIC_LINKS} pathname={pathname} />
          <div style={{ height: 1, background: clay.colors.hairline }} />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            style={{
              width: "100%",
              textAlign: "left",
              padding: `${space.s12} ${space.s16}`,
              ...typography.sizes.t16,
              fontWeight: 600,
              color: clay.colors.ink,
              background: "transparent",
              border: "none",
              borderLeft: `2px solid transparent`,
              cursor: "pointer",
              fontFamily: clay.font.body,
            }}
          >
            Logg ut
          </button>
        </div>
      </fm.aside>
    </>
  );
}

function MenuSection({
  title,
  links,
  pathname,
}: {
  title: string;
  links: NavLink[];
  pathname: string | null;
}) {
  return (
    <div>
      <p
        style={{
          ...typography.sizes.t12,
          fontFamily: clay.font.body,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: clay.colors.muted,
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
                  display: "flex",
                  flexDirection: "column",
                  gap: space.s4,
                  padding: `${space.s12} ${space.s16}`,
                  fontFamily: clay.font.body,
                  textDecoration: "none",
                  background: active ? colors.brandWarmBlue : "transparent",
                  borderRadius: "var(--clay-radius-md)",
                  outline: "none",
                  transition: `background ${motion.fast}, color ${motion.fast}`,
                }}
              >
                <span
                  style={{
                    ...typography.sizes.t16,
                    fontWeight: active ? 600 : 500,
                    color: active ? colors.textLight : clay.colors.ink,
                  }}
                >
                  {link.label}
                </span>
                <span
                  style={{
                    ...typography.sizes.t12,
                    fontWeight: 400,
                    color: active ? "rgba(255, 255, 255, 0.82)" : clay.colors.muted,
                  }}
                >
                  {link.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
