"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";
import { Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface ProfileRow {
  id: string;
  full_name: string | null;
  name?: string | null;
  institution: string | null;
  role: string | null;
  wp: string | null;
  bio: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  institution: string;
  role: string;
}

// Ingen hardkodet reserveliste. Den forrige inneholdt feil roller og
// duplikate id-er, og en liste med feil er verre enn en ærlig tomtilstand —
// `profiles` er fasit for hvem som er med i prosjektgruppen.

function normalize(rows: ProfileRow[], defaultRole: string): TeamMember[] {
  return rows
    .map((r) => {
      const name = (r.full_name ?? r.name ?? "").trim();
      if (!name) return null;
      const role = [r.role, r.wp].filter(Boolean).join(" — ");
      return {
        id: r.id,
        name,
        institution: r.institution ?? "",
        role: role || defaultRole,
      };
    })
    .filter((x): x is TeamMember => x != null);
}

export default function People() {
  const { t } = useI18n();
  const [members, setMembers] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, name, institution, role, wp, bio")
        .order("full_name", { ascending: true });
      if (!active) return;
      if (error || !data) {
        setMembers([]);
        return;
      }
      setMembers(normalize(data as ProfileRow[], t.people.defaultRole));
    })();
    return () => {
      active = false;
    };
  }, [t.people.defaultRole]);

  // `null` = spørringen er ikke ferdig. Ingenting vises før vi vet svaret,
  // slik at tomtilstanden ikke blinker forbi på hver sidelast.
  if (members === null) return null;

  if (members.length === 0) {
    return (
      <p style={{ ...typography.sizes.t16, color: colors.textMuted }}>
        {t.people.placeholder}
      </p>
    );
  }

  const list = members;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: space.s16,
      }}
    >
      {list.map((m) => (
        <Card key={m.id} padding="md">
          <p
            style={{
              ...typography.sizes.t18,
              fontWeight: typography.weights.medium,
              color: colors.textBody,
              marginBottom: space.s4,
            }}
          >
            {m.name}
          </p>
          {m.institution && (
            <p style={{ ...typography.sizes.t14, color: colors.brandWarmBlue, marginBottom: space.s8 }}>
              {m.institution}
            </p>
          )}
          {m.role && (
            <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>
              {m.role}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
