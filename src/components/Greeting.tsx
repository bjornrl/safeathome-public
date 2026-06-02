"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { clay, space, typography } from "@/lib/design-tokens";

/** First name from a full name, falling back to the whole string. */
function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

/**
 * Personalised welcome banner shown at the top of the authenticated area.
 * Reads the signed-in user's `full_name` from the `profiles` table.
 */
export default function Greeting() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        if (active) setName(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;
      setName(profile?.full_name ? firstName(profile.full_name) : null);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        load();
      } else if (active) {
        setName(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Nothing to show until we know who the user is — avoids a flash of a
  // nameless greeting.
  if (!name) return null;

  return (
    <div style={{ background: clay.colors.teal }}>
      <p
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: `${space.s12} ${space.s24}`,
          ...typography.sizes.t14,
          fontFamily: clay.font.body,
          fontWeight: 500,
          color: clay.colors.onPrimary,
        }}
      >
        Hei <strong style={{ fontWeight: 700, color: clay.colors.mint }}>{name}</strong>, velkommen
        tilbake til Safe@Home-plattformen
      </p>
    </div>
  );
}
