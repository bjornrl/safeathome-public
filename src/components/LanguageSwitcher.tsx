"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LOCALES,
  LOCALE_NAMES,
  SWITCH_TO,
  otherLocale,
  splitLocale,
  withLocale,
} from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { clay, motion, space, typography } from "@/lib/design-tokens";

/**
 * Swaps the locale segment of the current URL, keeping the path and query
 * intact — so switching language never throws the reader back to the front
 * page. Rendered as links rather than a client-side toggle so the choice is
 * shareable and works without JavaScript.
 */
export default function LanguageSwitcher({
  compact = false,
}: {
  /** Single toggle chip for the nav row. Otherwise a plain pair of links. */
  compact?: boolean;
}) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { rest } = splitLocale(pathname ?? "/");
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";
  const hrefFor = (locale: (typeof LOCALES)[number]) =>
    `${withLocale(locale, rest)}${suffix}`;

  // In the nav row: one chip that reads as the language you are in, and turns
  // into the invitation to leave it on hover. The visible text changes, so the
  // accessible name carries the meaning instead — a screen reader announces
  // "Switch to English" either way, and never the ambiguous "Norsk".
  if (compact) {
    const target = otherLocale(lang);
    return (
      <Link
        href={hrefFor(target)}
        hrefLang={target}
        aria-label={SWITCH_TO[target]}
        className="nav-chip nav-lang"
      >
        <span className="nav-lang__current" aria-hidden>
          {LOCALE_NAMES[lang]}
        </span>
        <span className="nav-lang__switch" aria-hidden>
          {SWITCH_TO[target]}
        </span>
      </Link>
    );
  }

  return (
    <nav
      aria-label={t.common.languageLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: space.s4,
        fontFamily: clay.font.body,
      }}
    >
      {LOCALES.map((locale, i) => {
        const active = locale === lang;
        return (
          <span key={locale} style={{ display: "inline-flex", alignItems: "center", gap: space.s4 }}>
            {i > 0 && (
              <span aria-hidden style={{ color: clay.colors.hairline }}>
                /
              </span>
            )}
            <Link
              href={hrefFor(locale)}
              hrefLang={locale}
              aria-current={active ? "true" : undefined}
              style={{
                ...typography.sizes.t12,
                fontWeight: active ? 700 : 500,
                color: active ? clay.colors.ink : clay.colors.muted,
                textDecoration: "none",
                transition: `color ${motion.fast}`,
              }}
            >
              {LOCALE_NAMES[locale]}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
