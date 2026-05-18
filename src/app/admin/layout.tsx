"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

function buildLoginRedirect(pathname: string | null, search: string): string {
  const path = pathname ?? "/admin";
  const target = search ? `${path}?${search}` : path;
  return `/login?redirect=${encodeURIComponent(target)}`;
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"checking" | "authed" | "anon">("checking");

  useEffect(() => {
    let active = true;
    const loginUrl = buildLoginRedirect(pathname, searchParams.toString());

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
  }, [router, pathname, searchParams]);

  if (status === "checking") {
    return (
      <main style={{ padding: "80px 24px", textAlign: "center", color: "#808080", fontFamily: FONT_STACK }}>
        Sjekker økt…
      </main>
    );
  }

  if (status !== "authed") {
    return null;
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav mode="internal" />
      <Suspense
        fallback={
          <main style={{ padding: "80px 24px", textAlign: "center", color: "#808080", fontFamily: FONT_STACK }}>
            Sjekker økt…
          </main>
        }
      >
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </>
  );
}
