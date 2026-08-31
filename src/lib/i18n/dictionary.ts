import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/no";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  no: () => import("./dictionaries/no").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
};

/**
 * Load the dictionary for a locale. Called once per request in the [lang]
 * layout; the result is handed to client components through I18nProvider, so
 * only the active locale is ever sent to the browser.
 */
export async function getDictionary(lang: Locale): Promise<Dictionary> {
  return loaders[lang]();
}

/**
 * Fill `{placeholders}` in a dictionary string.
 *
 *   fill(t.login.resendCooldown, { s: 42 }) → "Send ny kode (42 s)"
 *
 * Missing values are left as-is rather than blanked, so a typo shows up in the
 * UI instead of silently deleting text.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type { Dictionary };
