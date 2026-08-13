"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { motion as fm, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { clay, colors, motion, space, typography } from "@/lib/design-tokens";
import { Button } from "@/components/ui";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { splitLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/no";

export type NavVariant = "default" | "minimal";
export type NavMode = "public" | "internal";

type NavLink = { href: string; label: string; description: string };

function publicLinks(t: Dictionary): NavLink[] {
  return [{ href: "/about", ...t.nav.links.about }];
}

// Søk, nodekart, friksjoner, kvaliteter og lesesalen er slått sammen til faner
// under «Innhold» — samme korpus, ulike innganger, én inngang i menyen.
function internalLinks(t: Dictionary): NavLink[] {
  return [
    { href: "/admin", ...t.nav.links.admin },
    { href: "/internal/content", ...t.nav.links.content },
    { href: "/internal/threads", ...t.nav.links.threads },
    { href: "/welfare-tech", ...t.nav.links.welfareTech },
  ];
}

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

/** `pathname` carries the locale prefix; `href` never does. */
function isLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const { rest } = splitLocale(pathname);
  const path = href.split("?")[0];
  if (path === "/") return rest === "/";
  return rest === path || rest.startsWith(path + "/");
}

export default function Nav({
  variant = "default",
  mode = "public",
}: {
  variant?: NavVariant;
  mode?: NavMode;
}) {
  const { t, href } = useI18n();
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

  const homeHref = href(signedIn ? "/internal" : "/");

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

        <div style={{ pointerEvents: "auto", display: "inline-flex", alignItems: "center", gap: space.s12 }}>
          <Suspense fallback={null}>
            <LanguageSwitcher compact />
          </Suspense>
          {signedIn ? (
            <Link href={homeHref} style={{ textDecoration: "none" }}>
              <Button variant="primary" size="sm">{t.nav.admin}</Button>
            </Link>
          ) : (
            <Link href={href("/login")} style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="sm">{t.nav.signIn}</Button>
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
            alignItems: "center",
            justifyContent: "flex-end",
            gap: space.s16,
            ...typography.sizes.t12,
            color: clay.colors.muted,
            fontFamily: clay.font.body,
          }}
        >
          <span>{t.nav.utility}</span>
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
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
  const { t, href } = useI18n();
  return (
    <nav
      aria-label={t.nav.mainMenu}
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
        {publicLinks(t).map((link) => {
          const active = isLinkActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={href(link.href)}
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
        <Link href={href("/admin")} style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="sm">{t.nav.admin}</Button>
        </Link>
      ) : (
        <Link
          href={href("/login")}
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
          {t.nav.signInTeam}
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
  const { t, href } = useI18n();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: space.s8 }}>
      <Suspense fallback={null}>
        <LanguageSwitcher compact />
      </Suspense>
      {/* «Nytt notat» skal nås fra hele det interne området, ikke bare fra en
          fane inne i /admin — å senke terskelen for å levere inn et notat er
          den viktigste enkeltendringen for datainnsamlerne (prompt 03, punkt 3). */}
      <Link
        href={href("/admin?tab=notes")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: `${space.s8} ${space.s12}`,
          background: clay.colors.ink,
          color: clay.colors.onPrimary,
          border: `1px solid ${clay.colors.ink}`,
          borderRadius: "var(--clay-radius-md)",
          textDecoration: "none",
          fontFamily: clay.font.body,
          ...typography.sizes.t14,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {t.nav.newNote}
      </Link>
    <button
      ref={toggleRef}
      type="button"
      aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
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
      <span>{menuOpen ? t.nav.closeShort : t.nav.menu}</span>
    </button>
    </div>
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
  const { t, href } = useI18n();
  async function signOut() {
    await supabase.auth.signOut();
    router.replace(href("/login"));
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
        aria-label={t.nav.menu}
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
            {t.nav.menu}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.nav.closeMenu}
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
          <MenuSection title={t.nav.sectionInternal} links={internalLinks(t)} pathname={pathname} />
          <div style={{ height: 1, background: clay.colors.hairline }} />
          <MenuSection title={t.nav.sectionPublic} links={publicLinks(t)} pathname={pathname} />
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
            {t.nav.signOut}
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
  const { href } = useI18n();
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
                href={href(link.href)}
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
