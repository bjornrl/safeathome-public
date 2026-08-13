"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALES, LOCALE_NAMES, splitLocale, withLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { clay, motion, space, typography } from "@/lib/design-tokens";

/**
 * Swaps the locale segment of the current URL, keeping the path and query
 * intact — so switching language never throws the reader back to the front
 * page. Rendered as links rather than a client-side toggle so the choice is
 * shareable and works without JavaScript.
 */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { rest } = splitLocale(pathname ?? "/");
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

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
              href={`${withLocale(locale, rest)}${suffix}`}
              hrefLang={locale}
              aria-current={active ? "true" : undefined}
              style={{
                ...typography.sizes.t12,
                fontWeight: active ? 700 : 500,
                color: active ? clay.colors.ink : clay.colors.muted,
                textDecoration: "none",
                textTransform: compact ? "uppercase" : "none",
                letterSpacing: compact ? "0.08em" : undefined,
                transition: `color ${motion.fast}`,
              }}
            >
              {compact ? locale : LOCALE_NAMES[locale]}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
