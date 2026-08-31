"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { splitLocale, withLocale, type Locale } from "@/lib/i18n/config";


/** Both the target and the /login route keep the locale the reader is on. */
function buildLoginRedirect(lang: Locale, pathname: string | null, search: string): string {
  const path = pathname && splitLocale(pathname).lang ? pathname : withLocale(lang, "/internal");
  const target = search ? `${path}?${search}` : path;
  return `${withLocale(lang, "/login")}?redirect=${encodeURIComponent(target)}`;
}

function InternalGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<"checking" | "authed" | "anon">("checking");

  useEffect(() => {
    let active = true;
    const loginUrl = buildLoginRedirect(lang, pathname, searchParams.toString());

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setStatus("authed");
      } else {
        setStatus("anon");
        router.replace(loginUrl);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStatus("authed");
      } else {
        setStatus("anon");
        router.replace(loginUrl);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname, searchParams, lang]);

  if (status === "checking") {
    return (
      <main
        style={{
          fontFamily: FONT_STACK,
          padding: `${space.s64} ${space.s24}`,
          textAlign: "center",
          color: colors.textMuted,
          ...typography.sizes.t14,
        }}
      >
        {t.internal.checkingSession}
      </main>
    );
  }

  if (status !== "authed") return null;
  return <>{children}</>;
}

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <>
      <Nav mode="internal" />
      <Suspense
        fallback={
          <main
            style={{
              fontFamily: FONT_STACK,
              padding: `${space.s64} ${space.s24}`,
              textAlign: "center",
              color: colors.textMuted,
              ...typography.sizes.t14,
            }}
          >
            {t.internal.checkingSession}
          </main>
        }
      >
        <InternalGate>{children}</InternalGate>
      </Suspense>
    </>
  );
}
