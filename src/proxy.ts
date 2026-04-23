import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DEV_LOCK_ENABLED = process.env.NEXT_PUBLIC_DEV_LOCK === "1";

const PUBLIC_PATHS = ["/", "/auth", "/auth/reset"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return pathname.startsWith("/auth/");
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function proxy(request: NextRequest) {
  if (!DEV_LOCK_ENABLED) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Build a response we can attach refreshed cookies to.
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

  if (isAdminPath(pathname)) {
    if (!signedIn) {
      const redirect = new URL("/auth", request.url);
      return NextResponse.redirect(redirect);
    }
    return response;
  }

  if (isPublicPath(pathname)) return response;

  if (!signedIn) {
    const redirect = new URL("/", request.url);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals, static assets, and favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|gltf)$).*)",
  ],
};
