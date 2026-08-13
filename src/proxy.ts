import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { matchLocale, splitLocale, withLocale, type Locale } from "@/lib/i18n/config";

const DEV_LOCK_ENABLED = process.env.NEXT_PUBLIC_DEV_LOCK === "1";

/** Remembers the visitor's choice so the next bare URL lands in the same language. */
const LOCALE_COOKIE = "safeathome-locale";

const PUBLIC_PATHS = new Set(["/", "/login", "/auth", "/auth/reset"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // /auth/* and /login/* (e.g. callback subroutes) stay public.
  if (pathname.startsWith("/auth/") || pathname.startsWith("/login/")) return true;
  return false;
}

// Analysevisningene. Offentlig = prosjektinformasjon; historier, taksonomi-
// grupperinger og designresponser er analyse og hører bak innlogging
// (strategidokumentets §3 og beslutning 8). Gjelder uavhengig av dev-låsen.
const ALWAYS_PROTECTED = [
  "/admin",
  "/internal",
  "/frictions",
  "/qualities",
  "/reading-room",
  "/welfare-tech",
  "/story",
  "/solutions",
];

function isInternalPath(pathname: string): boolean {
  return ALWAYS_PROTECTED.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

function loginRedirect(request: NextRequest, lang: Locale): URL {
  // The redirect target keeps its locale prefix so signing in returns the
  // visitor to the page in the language they were reading.
  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const url = new URL(withLocale(lang, "/login"), request.url);
  url.searchParams.set("redirect", target);
  return url;
}

/** Cookie first (an explicit choice), then Accept-Language, then Norwegian. */
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie === "no" || cookie === "en") return cookie;
  return matchLocale(request.headers.get("accept-language"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Locale in the path, always ──
  const { lang: pathLocale, rest } = splitLocale(pathname);

  if (!pathLocale) {
    const locale = preferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = withLocale(locale, pathname);
    return NextResponse.redirect(url);
  }

  const lang = pathLocale;
  const response = NextResponse.next();

  // Persist the language actually being viewed, so a later bare URL matches it.
  if (request.cookies.get(LOCALE_COOKIE)?.value !== lang) {
    response.cookies.set({
      name: LOCALE_COOKIE,
      value: lang,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // ── 2. Auth, evaluated against the path *without* its locale prefix ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const { data: claims } = await supabase.auth.getClaims();
  const signedIn = Boolean(claims);

  // Internal area always requires auth.
  if (isInternalPath(rest)) {
    if (!signedIn) {
      return NextResponse.redirect(loginRedirect(request, lang));
    }
    return response;
  }

  // Optional dev lock: require auth on every non-public route.
  if (DEV_LOCK_ENABLED && !isPublicPath(rest) && !signedIn) {
    return NextResponse.redirect(loginRedirect(request, lang));
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals, static assets, API routes and
    // favicon. `/auth/debug-suggest` is a route handler and has no locale.
    "/((?!_next/static|_next/image|favicon.ico|auth/debug-suggest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
