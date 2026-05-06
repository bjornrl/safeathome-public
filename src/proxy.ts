import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DEV_LOCK_ENABLED = process.env.NEXT_PUBLIC_DEV_LOCK === "1";

const PUBLIC_PATHS = new Set(["/", "/login", "/auth", "/auth/reset"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // /auth/* and /login/* (e.g. callback subroutes) stay public.
  if (pathname.startsWith("/auth/") || pathname.startsWith("/login/")) return true;
  return false;
}

function isInternalPath(pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  if (pathname === "/internal" || pathname.startsWith("/internal/")) return true;
  return false;
}

function loginRedirect(request: NextRequest): URL {
  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const url = new URL("/login", request.url);
  url.searchParams.set("redirect", target);
  return url;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

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
  if (isInternalPath(pathname)) {
    if (!signedIn) {
      return NextResponse.redirect(loginRedirect(request));
    }
    return response;
  }

  // Optional dev lock: require auth on every non-public route.
  if (DEV_LOCK_ENABLED && !isPublicPath(pathname) && !signedIn) {
    return NextResponse.redirect(loginRedirect(request));
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals, static assets, and favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|gltf)$).*)",
  ],
};
