"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { space } from "@/lib/design-tokens";

// "Utforsk plattformen" links into the authed internal map. Hide it for
// anonymous visitors so the public hero only surfaces the about-page CTA.
export function HomeHeroCtas() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div style={{ display: "flex", gap: space.s12, flexWrap: "wrap" }}>
      <Link href="/about" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="lg">Les mer om SAFE@HOME</Button>
      </Link>
      {signedIn && (
        <Link href="/explore" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="lg">Utforsk plattformen →</Button>
        </Link>
      )}
    </div>
  );
}
