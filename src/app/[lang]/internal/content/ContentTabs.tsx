"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ContentBrowser from "@/components/content/ContentBrowser";
import NodeMapClient from "../nodes/NodeMapClient";
import FrictionsPanel from "@/components/content/FrictionsPanel";
import QualitiesPanel from "@/components/content/QualitiesPanel";
import { FONT_STACK, colors, space, typography } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";

const TAB_KEYS = ["search", "nodes", "frictions", "qualities"] as const;

type Tab = (typeof TAB_KEYS)[number];

function isTab(v: string | null): v is Tab {
  return v !== null && (TAB_KEYS as readonly string[]).includes(v);
}

export default function ContentTabs() {
  const { t } = useI18n();
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

  const copy = t.content.tabCopy[tab];

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
          {t.content.eyebrow}
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
          {t.content.heading}
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
          {t.content.lead}
        </p>
      </header>

      <nav
        aria-label={t.content.tabsLabel}
        style={{
          display: "flex",
          gap: space.s4,
          flexWrap: "wrap",
          borderBottom: `1px solid ${colors.borderSubtle}`,
          marginBottom: space.s32,
        }}
      >
        {TAB_KEYS.map((key) => (
          <TabButton key={key} active={tab === key} onClick={() => selectTab(key)}>
            {t.content.tabs[key]}
          </TabButton>
        ))}
      </nav>

      <section aria-labelledby="content-tab-heading">
        <div style={{ marginBottom: tab === "nodes" ? space.s16 : space.s32, maxWidth: 720 }}>
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

        {/* Mounted only while selected: the node map runs a D3 force simulation
            and the search tab refetches the whole corpus. */}
        {tab === "search" && <ContentBrowser />}
        {tab === "nodes" && <NodeMapClient />}
        {tab === "frictions" && <FrictionsPanel />}
        {tab === "qualities" && <QualitiesPanel />}
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
