import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ResourceList from "@/components/ResourceList";
import { getResources } from "@/lib/queries";
import { MUNICIPAL_TYPES } from "@/lib/seed-resources";

export const metadata: Metadata = {
  title: "For Municipalities — safe@home",
  description:
    "Toolkits, practice guides, and municipal experiences from the safe@home project.",
};

export const revalidate = 60;

export default async function ForMunicipalitiesPage() {
  const resources = await getResources(MUNICIPAL_TYPES);

  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "72px 24px 96px",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "#A09A8E",
            marginBottom: 12,
          }}
        >
          For municipalities
        </p>
        <h1
          style={{
            fontFamily: "var(--font-source-serif)",
            fontSize: "clamp(38px, 6vw, 60px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#2C2A25",
            marginBottom: 18,
          }}
        >
          Tools &amp; experiences from the field.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-source-serif)",
            fontSize: 19,
            lineHeight: 1.7,
            color: "#7A756B",
            maxWidth: 680,
            marginBottom: 56,
          }}
        >
          Editable toolkits, practice guides, and plain-language accounts of
          what partner municipalities are trying &mdash; what is working, what
          broke, and where the compromises live. Intended for homecare
          coordinators, planners, and service designers.
        </p>

        <ResourceList
          resources={resources}
          emptyMessage="No tools or experiences published yet."
          groupByType
        />
      </main>
    </>
  );
}
