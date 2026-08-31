"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clay, space, typography } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { splitLocale } from "@/lib/i18n/config";

/**
 * Bunnteksten. Monteres én gang i [lang]/layout.tsx og gjelder derfor alle
 * sider — samme mønster som ContactWidget, slik at sider som legges til
 * seinere får den uten at noen må huske det.
 *
 * Den lå tidligere to steder: som denne komponenten (bare brukt på /about) og
 * som ~120 linjer inline JSX nederst i forsida. Versjonene hadde drevet fra
 * hverandre — forsida hadde navigasjon og bunnlinje, denne hadde partnerlister
 * med etiketter. Begge deler er beholdt her, og de to gamle er borte.
 */

/**
 * Innloggingsskjermene har verken navlinje eller bunntekst — de er én oppgave
 * på én skjerm, og /login setter dessuten minHeight 100vh, så en bunntekst
 * ville lagt seg et helt skjermbilde under et halvtomt skjema. Samme
 * konvensjon som SUPPRESSED_PATHS i ContactWidget.
 */
const SUPPRESSED_PATHS = new Set(["/login", "/auth", "/auth/reset"]);

const RESEARCH_PARTNERS = ["OsloMet", "Universitetet i Oslo", "Durham University", "comte"];
const MUNICIPALITIES = ["Bydel Alna", "Bydel Søndre Nordstrand"];

export function Footer() {
  const { t, href } = useI18n();
  const pathname = usePathname();
  // null mens økta sjekkes: da vises verken innloggingslenka eller et hull der
  // den skal stå, framfor at den blinker inn og ut ved lasting.
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

  if (pathname && SUPPRESSED_PATHS.has(splitLocale(pathname).rest)) return null;

  const navLinks = [
    { href: href("/about"), label: t.footer.links.about },
    { href: href("/welfare-tech"), label: t.footer.links.welfareTech },
    { href: href("/for-municipalities"), label: t.footer.links.municipalities },
  ];

  return (
    <footer
      style={{
        background: clay.colors.surfaceSoft,
        borderTop: `1px solid ${clay.colors.hairline}`,
        color: clay.colors.body,
        fontFamily: clay.font.body,
      }}
    >
      <style>{CSS}</style>

      <div className="sf-top">
        <div>
          <p
            style={{
              fontFamily: clay.font.display,
              fontSize: "32px",
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: "-0.5px",
              color: clay.colors.ink,
              marginBottom: space.s16,
            }}
          >
            safe@home
          </p>
          <p style={{ ...typography.sizes.t14, color: clay.colors.body, maxWidth: "32ch", lineHeight: 1.55 }}>
            {t.footer.tagline}
          </p>
        </div>

        <nav aria-label={t.footer.navigate}>
          <h2 style={eyebrow}>{t.footer.navigate}</h2>
          <ul className="sf-list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link className="sf-link" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 style={eyebrow}>{t.footer.researchPartners}</h2>
          <ul className="sf-list">
            {RESEARCH_PARTNERS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 style={eyebrow}>{t.footer.municipalPartners}</h2>
          <ul className="sf-list">
            {MUNICIPALITIES.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${clay.colors.hairline}` }}>
        <div className="sf-bottom">
          <p style={{ ...typography.sizes.t12, color: clay.colors.mutedSoft }}>{t.footer.copyright}</p>
          {signedIn === false && (
            <Link className="sf-signin" href={href("/login")}>
              {t.nav.signInTeam}
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "20px",
  fontWeight: 600,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: clay.colors.muted,
  margin: `0 0 ${space.s16}`,
};

const CSS = `
.sf-top {
  max-width: 1280px;
  margin: 0 auto;
  padding: 72px 24px 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
}
/* Merkevarespalta får dobbel bredde når det er plass, slik at ingressen
   ikke brekker på fire ord. */
@media (min-width: 900px) {
  .sf-top { grid-template-columns: 2fr 1fr 1fr 1fr; }
}

.sf-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  line-height: 22px;
  color: var(--clay-body);
}

.sf-link {
  color: var(--clay-body);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color 0.18s ease, border-color 0.18s ease;
}
.sf-link:hover, .sf-link:focus-visible {
  color: var(--clay-ink);
  border-bottom-color: var(--clay-ink);
}

.sf-bottom {
  max-width: 1280px;
  margin: 0 auto;
  /* 56 px ekstra i bunnen: meldingsboblen ligger fast 24 px fra hjørnet og
     ville ellers dekket innloggingslenka når man har rullet helt ned. */
  padding: 16px 24px 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.sf-signin {
  font-size: 12px;
  line-height: 20px;
  color: var(--clay-muted);
  text-decoration: none;
  border-bottom: 1px dashed var(--clay-hairline);
  padding-bottom: 2px;
  transition: color 0.18s ease, border-color 0.18s ease;
}
.sf-signin:hover, .sf-signin:focus-visible {
  color: var(--clay-ink);
  border-bottom-color: var(--clay-ink);
}

@media (prefers-reduced-motion: reduce) {
  .sf-link, .sf-signin { transition: none; }
}
`;
