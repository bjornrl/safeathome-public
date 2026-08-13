/**
 * Locale configuration.
 *
 * Deliberately free of imports: this module is pulled in by the proxy (edge
 * runtime), by server components and by client components alike, so it must
 * stay serialisable and dependency-free.
 */

export const LOCALES = ["no", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Norwegian is the project's working language; English is the translation. */
export const DEFAULT_LOCALE: Locale = "no";

/** Name of each language *in* that language — never translated. */
export const LOCALE_NAMES: Record<Locale, string> = {
  no: "Norsk",
  en: "English",
};

/** Value for <html lang>. */
export const HTML_LANG: Record<Locale, string> = {
  no: "nb-NO",
  en: "en-GB",
};

/** Argument for toLocaleDateString / localeCompare. */
export const INTL_LOCALE: Record<Locale, string> = {
  no: "nb-NO",
  en: "en-GB",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value);
}

/**
 * Prefix an app-internal path with the active locale.
 * External URLs, hashes and query-only strings are returned untouched.
 */
export function withLocale(lang: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href === "/") return `/${lang}`;
  return `/${lang}${href}`;
}

/**
 * Split a pathname into its locale segment and the rest.
 * `/en/internal/content` → `{ lang: "en", rest: "/internal/content" }`
 * `/internal/content`    → `{ lang: null, rest: "/internal/content" }`
 */
export function splitLocale(pathname: string): { lang: Locale | null; rest: string } {
  const segments = pathname.split("/");
  const first = segments[1];
  if (!isLocale(first)) return { lang: null, rest: pathname };
  const rest = "/" + segments.slice(2).join("/");
  return { lang: first, rest: rest === "/" ? "/" : rest.replace(/\/$/, "") || "/" };
}

/**
 * Pick a locale from an Accept-Language header. Kept small on purpose — two
 * locales do not justify a negotiation library.
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // Norwegian has three tags in the wild — nb, nn and the macrolanguage no.
    if (tag === "nb" || tag === "nn" || tag === "no" || tag.startsWith("nb-") || tag.startsWith("nn-") || tag.startsWith("no-")) {
      return "no";
    }
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }
  return DEFAULT_LOCALE;
}
