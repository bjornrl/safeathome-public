"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion as fm, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { clay, space, typography } from "@/lib/design-tokens";
import ContactForm from "@/components/ContactForm";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { splitLocale } from "@/lib/i18n/config";

/**
 * Meldingsboblen nede til høyre.
 *
 * Monteres én gang i rot-layouten og bestemmer selv om den skal vises:
 * bare for innloggede, og ikke på /internal — der ligger skjemaet allerede
 * inne på sida, og to skjemaer på samme skjerm ville vært støy.
 */

/** Sider som har skjemaet inline og derfor ikke skal ha boblen i tillegg. */
const SUPPRESSED_PATHS = new Set(["/internal"]);

export default function ContactWidget() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Lukk ved navigasjon, slik at panelet ikke henger igjen over en ny side.
  // Justeres under render framfor i en effekt: en effekt her ville gitt en
  // ekstra render-runde med panelet fortsatt synlig på den nye sida.
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }
  const launcherRef = useRef<HTMLButtonElement | null>(null);

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

  // Escape + klikk utenfor lukker panelet — samme oppførsel som Nav-menyen.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (
        target &&
        !panelRef.current?.contains(target) &&
        !launcherRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);


  if (!signedIn) return null;
  // SUPPRESSED_PATHS er uten språkprefiks; pathname har det. Uten å strippe
  // det ville "/no/internal" aldri matchet, og boblen ville lagt seg oppå
  // skjemaet som allerede står inline på den sida.
  if (pathname && SUPPRESSED_PATHS.has(splitLocale(pathname).rest)) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: space.s24,
        bottom: space.s24,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: space.s12,
        fontFamily: clay.font.body,
      }}
    >
      <AnimatePresence>
        {open && (
          <fm.div
            ref={panelRef}
            key="panel"
            role="dialog"
            aria-label={t.contact.panelLabel}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            style={{
              width: 380,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "calc(100dvh - 140px)",
              overflowY: "auto",
              background: clay.colors.canvas,
              border: `1px solid ${clay.colors.hairline}`,
              borderRadius: "var(--clay-radius-lg)",
              boxShadow: "0 16px 40px rgba(42, 40, 89, 0.18)",
            }}
          >
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: `${space.s16} ${space.s16} ${space.s12}`,
                borderBottom: `1px solid ${clay.colors.hairline}`,
              }}
            >
              <div>
                <p
                  style={{
                    ...typography.sizes.t16,
                    fontWeight: 600,
                    color: clay.colors.ink,
                    margin: 0,
                  }}
                >
                  {t.contact.title}
                </p>
                <p style={{ ...typography.sizes.t12, color: clay.colors.muted, margin: 0 }}>
                  {t.contact.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.contact.close}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: clay.colors.muted,
                  padding: 0,
                }}
              >
                ×
              </button>
            </header>

            <div style={{ padding: space.s16 }}>
              <ContactForm compact />
            </div>
          </fm.div>
        )}
      </AnimatePresence>

      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.contact.closeLauncherLabel : t.contact.openLauncherLabel}
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: space.s8,
          padding: `${space.s12} ${space.s16}`,
          background: clay.colors.ink,
          color: clay.colors.onPrimary,
          border: `1px solid ${clay.colors.ink}`,
          borderRadius: "var(--clay-radius-pill)",
          boxShadow: "0 6px 20px rgba(42, 40, 89, 0.22)",
          cursor: "pointer",
          fontFamily: clay.font.body,
          ...typography.sizes.t14,
          fontWeight: 600,
        }}
      >
        <ChatIcon open={open} />
        <span>{open ? t.contact.close : t.contact.launcher}</span>
      </button>
    </div>
  );
}

function ChatIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden style={{ display: "block" }}>
        <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden style={{ display: "block" }}>
      <path
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6A1.5 1.5 0 0 1 12.5 11H6.8L3.6 13.7A.5.5 0 0 1 2.8 13.3V11H3.5A1.5 1.5 0 0 1 2 9.5z"
        fill="currentColor"
      />
    </svg>
  );
}
