import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Auth-aware Supabase client for use inside server actions / route handlers.
// Reads the session from the request cookies so RLS sees the actual user.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies — middleware refreshes
            // sessions, so this is safe to swallow here.
          }
        },
      },
    },
  );
}
