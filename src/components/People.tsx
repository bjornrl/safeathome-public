"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";
import { Card } from "@/components/ui";

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

const FALLBACK_TEAM: TeamMember[] = [
  { id: "marit-haldar",        name: "Marit Haldar",                  institution: "OsloMet",       role: "Prosjektleder (PI)" },
  { id: "carolina-rau",        name: "Carolina Rau",                  institution: "UiO",           role: "WP1-leder — Hjem og fellesskap" },
  { id: "jonas-debesay",       name: "Jonas Debesay",                 institution: "OsloMet",       role: "WP2-leder — Helse- og omsorgsinstitusjoner" },
  { id: "erika-gubrium",       name: "Erika Gubrium",                 institution: "OsloMet",       role: "WP3-leder — Transnasjonale kontekster" },
  { id: "alejandro-miranda",   name: "Alejandro Miranda Nieto",       institution: "OsloMet",       role: "WP4 med-leder — Innovasjon og tjenestedesign" },
  { id: "oystein-evensen",     name: "Øystein Evensen",               institution: "Comte Bureau",  role: "WP4 med-leder — Plattform og tjenestedesign" },
];

function normalize(rows: ProfileRow[]): TeamMember[] {
  return rows
    .map((r) => {
      const name = (r.full_name ?? r.name ?? "").trim();
      if (!name) return null;
      const role = [r.role, r.wp].filter(Boolean).join(" — ");
      return {
        id: r.id,
        name,
        institution: r.institution ?? "",
        role: role || "Prosjektgruppe",
      };
    })
    .filter((x): x is TeamMember => x != null);
}

export default function People() {
  const [members, setMembers] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, name, institution, role, wp, bio")
        .order("full_name", { ascending: true });
      if (!active) return;
      if (error || !data || data.length === 0) {
        setMembers(FALLBACK_TEAM);
        return;
      }
      const normalized = normalize(data as ProfileRow[]);
      setMembers(normalized.length > 0 ? normalized : FALLBACK_TEAM);
    })();
    return () => {
      active = false;
    };
  }, []);

  const list = members ?? FALLBACK_TEAM;

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
