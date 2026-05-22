"use client";

import { useState } from "react";
import {
  FRICTIONS,
  QUALITIES,
  SCALES,
  WORK_PACKAGE_INFO,
  type WorkPackageId,
} from "@/lib/constants";
import type { CareFriction, CareQuality, MapScale } from "@/lib/types";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

type Kind = "friction" | "quality" | "scale" | "work_package";

interface CategoryHelpProps {
  kind: Kind;
  /**
   * Optional headline shown above the description grid. Defaults to a sensible
   * Norwegian label for the kind.
   */
  title?: string;
  /**
   * Optional one-line intro. Use when the help block is the only context the
   * user has — e.g. on top of a category multi-select they're seeing for the
   * first time.
   */
  intro?: string;
  /** Render compactly (no border, no padding) when embedded in dense forms. */
  compact?: boolean;
}

const DEFAULT_TITLE: Record<Kind, string> = {
  friction: "Hva betyr friksjonene?",
  quality: "Hva betyr kvalitetene?",
  scale: "Hva betyr skalaene?",
  work_package: "Hva er arbeidspakkene?",
};

/**
 * Collapsed-by-default help card that explains a category set in plain
 * Norwegian. Designed to sit directly above a CheckboxGroup or dropdown so
 * a new editor can learn what to pick.
 */
export function CategoryHelp({ kind, title, intro, compact = false }: CategoryHelpProps) {
  const [open, setOpen] = useState(false);

  const headline = title ?? DEFAULT_TITLE[kind];

  return (
    <div
      style={{
        fontFamily: FONT_STACK,
        background: open ? "#f9f8f3" : "transparent",
        border: compact ? "none" : `1px solid ${open ? "#e6e0c8" : "transparent"}`,
        borderRadius: 8,
        padding: compact ? 0 : open ? 12 : 0,
        marginBottom: 8,
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: FONT_STACK,
          fontSize: 12,
          fontWeight: 600,
          color: "#1f42aa",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span aria-hidden>{open ? "▾" : "▸"}</span>
        {open ? "Skjul forklaring" : headline}
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {intro && (
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "#4d4d4d",
                marginBottom: 12,
              }}
            >
              {intro}
            </p>
          )}
          {kind === "friction" && <FrictionList />}
          {kind === "quality" && <QualityList />}
          {kind === "scale" && <ScaleList />}
          {kind === "work_package" && <WorkPackageList />}
        </div>
      )}
    </div>
  );
}

function HelpRow({
  color,
  label,
  description,
  examples,
}: {
  color: string;
  label: string;
  description: string;
  examples?: string[];
}) {
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 10,
        padding: "8px 0",
        borderTop: "1px solid #ece6d8",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          marginTop: 6,
        }}
      />
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#2a2859", margin: 0 }}>
          {label}
        </p>
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            color: "#4d4d4d",
            margin: "4px 0 0",
          }}
        >
          {description}
        </p>
        {examples && examples.length > 0 && (
          <ul
            style={{
              margin: "6px 0 0 16px",
              padding: 0,
              fontSize: 11,
              color: "#666666",
              lineHeight: 1.55,
            }}
          >
            {examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function FrictionList() {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {(Object.keys(FRICTIONS) as CareFriction[]).map((key) => {
        const f = FRICTIONS[key];
        return (
          <HelpRow
            key={key}
            color={f.color}
            label={f.label}
            description={f.longDescription}
            examples={f.examples}
          />
        );
      })}
    </ul>
  );
}

function QualityList() {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {(Object.keys(QUALITIES) as CareQuality[]).map((key) => {
        const q = QUALITIES[key];
        return (
          <HelpRow
            key={key}
            color={q.color}
            label={q.label}
            description={q.longDescription}
            examples={q.examples}
          />
        );
      })}
    </ul>
  );
}

function ScaleList() {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {(Object.keys(SCALES) as MapScale[]).map((key) => {
        const s = SCALES[key];
        return (
          <HelpRow
            key={key}
            color="#2a2859"
            label={s.label}
            description={s.longDescription}
          />
        );
      })}
    </ul>
  );
}

function WorkPackageList() {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {(Object.keys(WORK_PACKAGE_INFO) as WorkPackageId[]).map((key) => {
        const wp = WORK_PACKAGE_INFO[key];
        return (
          <HelpRow
            key={key}
            color="#5B6AAF"
            label={wp.label}
            description={wp.longDescription}
          />
        );
      })}
    </ul>
  );
}
