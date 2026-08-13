"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchClient from "@/app/internal/search/SearchClient";
import NodeMapClient from "@/app/internal/nodes/NodeMapClient";
import FrictionsPanel from "@/components/content/FrictionsPanel";
import QualitiesPanel from "@/components/content/QualitiesPanel";
import ResourcesPanel from "@/components/content/ResourcesPanel";
import { FONT_STACK, colors, typography } from "@/lib/design-tokens";

const TABS = [
  { key: "search", label: "Søk" },
  { key: "nodes", label: "Nodekart" },
  { key: "frictions", label: "Friksjoner" },
  { key: "qualities", label: "Kvaliteter" },
  { key: "resources", label: "Ressurser" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const TAB_KEYS = TABS.map((t) => t.key) as readonly string[];

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  search: "Alt materialet samlet. Listen viser hele korpuset til du søker — da smalner den inn.",
  nodes: "Kraftstyrt graf over notater og innsikter, koblet av delte kategorier.",
  frictions: "De sju friksjonene — mekanismene som gjør at velmenende omsorg likevel skader.",
  qualities: "Kvalitetene — det som gjør omsorg god når den treffer.",
  resources: "Publikasjoner, policy-notater, verktøykasser og kommunale erfaringer.",
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

  // Keeps the tab in step with back/forward and with links that deep-link a tab
  // (the old /frictions, /qualities, /internal/search … routes redirect here).
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

  return (
    <main
      id="main-content"
      style={{ fontFamily: FONT_STACK }}
      className="[max-width:1200px] [margin:0_auto] [padding:40px_24px_96px]"
    >
      <header className="[margin-bottom:24px]">
        <h1 className="[font-size:40px] [font-weight:700] [letter-spacing:-0.02em] [color:#2a2859] [margin:0_0_12px]">
          Innhold
        </h1>
        <p className="[font-size:15px] [color:#666666] [margin:0] [line-height:1.6] [max-width:720px]">
          Alt materialet i prosjektet, sett fra fem vinkler — samme korpus, ulike
          innganger.
        </p>
      </header>

      <nav className="[display:flex] [gap:8px] [margin-bottom:20px] [flex-wrap:wrap]">
        {TABS.map((t) => (
          <TabButton
            key={t.key}
            active={tab === t.key}
            onClick={() => selectTab(t.key)}
          >
            {t.label}
          </TabButton>
        ))}
      </nav>

      <p
        style={{
          margin: `0 0 28px`,
          ...typography.sizes.t18,
          color: colors.textMuted,
          maxWidth: 700,
          lineHeight: 1.6,
        }}
      >
        {TAB_DESCRIPTIONS[tab]}
      </p>

      {/* Mounted only while selected: the node map runs a D3 force simulation
          and the search tab refetches the whole corpus, neither of which should
          run in the background behind another tab. */}
      {tab === "search" && <SearchClient />}
      {tab === "nodes" && <NodeMapClient />}
      {tab === "frictions" && <FrictionsPanel />}
      {tab === "qualities" && <QualitiesPanel />}
      {tab === "resources" && <ResourcesPanel />}
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
      style={{
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 500,
        border: `1px solid ${active ? "#2a2859" : "#e6e6e6"}`,
        background: active ? "#2a2859" : "transparent",
        color: active ? "#ffffff" : "#2c2c2c",
        borderRadius: 999,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: FONT_STACK,
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}
    >
      {children}
    </button>
  );
}
