"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, INTL_LOCALE, withLocale, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/no";
import { getTaxonomy, type Taxonomy } from "./taxonomy";

interface I18nValue {
  lang: Locale;
  /** UI copy for the active locale. */
  t: Dictionary;
  /** Frictions, qualities, scales and work packages in the active locale. */
  tax: Taxonomy;
  /** Prefix an app-internal path with the active locale. */
  href: (path: string) => string;
  /** BCP-47 tag for toLocaleDateString / localeCompare. */
  intlLocale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  lang,
  dictionary,
  children,
}: {
  lang: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      lang,
      t: dictionary,
      tax: getTaxonomy(lang),
      href: (path: string) => withLocale(lang, path),
      intlLocale: INTL_LOCALE[lang],
    }),
    [lang, dictionary],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Read the active locale and its copy.
 *
 * Throws outside a provider rather than silently falling back: a client
 * component rendering Norwegian strings under /en is the exact bug this whole
 * layer exists to prevent, and a hard failure surfaces it during development.
 */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside <I18nProvider> (src/app/[lang]/layout.tsx)");
  }
  return value;
}

export { DEFAULT_LOCALE };
