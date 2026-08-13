"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchClient from "@/app/internal/search/SearchClient";
import NodeMapClient from "@/app/internal/nodes/NodeMapClient";
import FrictionsPanel from "@/components/content/FrictionsPanel";
import QualitiesPanel from "@/components/content/QualitiesPanel";
import ResourcesPanel from "@/components/content/ResourcesPanel";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";

const TABS = [
  { key: "search", label: "Søk" },
  { key: "nodes", label: "Nodekart" },
  { key: "frictions", label: "Friksjoner" },
  { key: "qualities", label: "Kvaliteter" },
  { key: "resources", label: "Ressurser" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const TAB_KEYS = TABS.map((t) => t.key) as readonly string[];

/** One clear content heading + lead per tab — the page title stays "Innhold". */
const TAB_COPY: Record<Tab, { title: string; lead: string }> = {
  search: {
    title: "Semantisk søk i materialet",
    lead: "Alt materialet samlet. Listen viser hele korpuset til du søker — da smalner den inn.",
  },
  nodes: {
    title: "Nodekart",
    lead: "Kraftstyrt graf over notater og innsikter, koblet av delte kategorier.",
  },
  frictions: {
    title: "Syv måter systemet kolliderer med virkeligheten på",
    lead: "Friksjoner navngir de gjentakende mekanismene der velmenende omsorg likevel skader.",
  },
  qualities: {
    title: "Hvordan folk faktisk lever og mestrer",
    lead: "Kvalitetene — det som gjør omsorg god når den treffer.",
  },
  resources: {
    title: "Ressurser",
    lead: "Publikasjoner, policy-notater, verktøykasser og kommunale erfaringer.",
  },
};

function isTab(v: string | null): v is Tab {
  return v !== null && TAB_KEYS.includes(v);
}

export default function ContentTabs() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const raw = searchParams.get("tab");
    return isTab(raw) ? raw : "search";
  });

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (isTab(raw) && raw !== tab) setTab(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function selectTab(next: Tab) {
    setTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url);
    }
  }

  const copy = TAB_COPY[tab];

  return (
    <main
      id="main-content"
      style={{
        fontFamily: FONT_STACK,
        maxWidth: 1200,
        margin: "0 auto",
        padding: `${space.s40} ${space.s24} ${space.s96}`,
      }}
    >
      {/* Page chrome: title → tabs → active section heading */}
      <header style={{ marginBottom: space.s32 }}>
        <p
          style={{
            ...typography.sizes.t12,
            fontWeight: typography.weights.bold,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: colors.textMuted,
            margin: `0 0 ${space.s12}`,
          }}
        >
          Internt
        </p>
        <h1
          style={{
            ...typography.sizes.t40,
            fontWeight: typography.weights.bold,
            letterSpacing: 0,
            color: colors.brandDarkBlue,
            margin: `0 0 ${space.s12}`,
            lineHeight: 1.15,
          }}
        >
          Innhold
        </h1>
        <p
          style={{
            ...typography.sizes.t16,
            color: colors.textMuted,
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 640,
          }}
        >
          Alt materialet i prosjektet, sett fra fem vinkler — samme korpus, ulike innganger.
        </p>
      </header>

      <nav
        aria-label="Innholdsfaner"
        style={{
          display: "flex",
          gap: space.s4,
          flexWrap: "wrap",
          borderBottom: `1px solid ${colors.borderSubtle}`,
          marginBottom: space.s32,
        }}
      >
        {TABS.map((t) => (
          <TabButton key={t.key} active={tab === t.key} onClick={() => selectTab(t.key)}>
            {t.label}
          </TabButton>
        ))}
      </nav>

      <section aria-labelledby="content-tab-heading">
        {tab !== "nodes" && (
          <div style={{ marginBottom: space.s32, maxWidth: 720 }}>
            <h2
              id="content-tab-heading"
              style={{
                ...typography.sizes.t26,
                fontWeight: typography.weights.bold,
                color: colors.brandDarkBlue,
                letterSpacing: 0,
                lineHeight: 1.25,
                margin: `0 0 ${space.s12}`,
              }}
            >
              {copy.title}
            </h2>
            <p
              style={{
                ...typography.sizes.t18,
                color: colors.textMuted,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {copy.lead}
            </p>
          </div>
        )}

        {/* Mounted only while selected: the node map runs a D3 force simulation
            and the search tab refetches the whole corpus. */}
        {tab === "search" && <SearchClient />}
        {tab === "nodes" && (
          <>
            <h2 id="content-tab-heading" className="sr-only">
              {copy.title}
            </h2>
            <p
              style={{
                ...typography.sizes.t16,
                color: colors.textMuted,
                margin: `0 0 ${space.s16}`,
                maxWidth: 640,
                lineHeight: 1.55,
              }}
            >
              {copy.lead}
            </p>
            <NodeMapClient />
          </>
        )}
        {tab === "frictions" && <FrictionsPanel />}
        {tab === "qualities" && <QualitiesPanel />}
        {tab === "resources" && <ResourcesPanel />}
      </section>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        padding: `${space.s12} ${space.s16}`,
        marginBottom: -1,
        fontSize: 15,
        fontWeight: active ? typography.weights.bold : typography.weights.medium,
        border: "none",
        borderBottom: `2px solid ${active ? colors.brandWarmBlue : "transparent"}`,
        background: "transparent",
        color: active ? colors.brandWarmBlue : colors.textBody,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: FONT_STACK,
      }}
    >
      {children}
    </button>
  );
}
