"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicResource, PublicStory, ResourceType, CareFriction, CareQuality } from "@/lib/types";
import { RESOURCE_TYPE_LABELS } from "@/lib/seed-resources";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import type { ResourceLinksByResource } from "@/lib/queries";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

// Oslo tones used to distinguish resource types at a glance.
const TYPE_ACCENT: Record<ResourceType, string> = {
  publication:    "#2a2859",
  policy_brief:   "#1f42aa",
  teaching_guide: "#034b45",
  toolkit:        "#4a8a83",
  practice_guide: "#ce8d1a",
  experience:     "#856b44",
};

export default function ResourceList({
  resources,
  emptyMessage,
  groupByType = false,
  links,
  storiesById,
}: {
  resources: PublicResource[];
  emptyMessage: string;
  groupByType?: boolean;
  links?: ResourceLinksByResource;
  storiesById?: Record<string, PublicStory>;
}) {
  if (resources.length === 0) {
    return (
      <p
        style={{
          fontFamily: FONT_STACK,
          fontSize: 17,
          color: "#808080",
          lineHeight: 1.6,
        }}
      >
        {emptyMessage}
      </p>
    );
  }

  if (groupByType) {
    const types = Array.from(new Set(resources.map((r) => r.type))) as ResourceType[];
    return (
      <div style={{ display: "grid", gap: 48, fontFamily: FONT_STACK }}>
        {types.map((t) => {
          const bucket = resources.filter((r) => r.type === t);
          return (
            <section key={t}>
              <header
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 24,
                  paddingBottom: 8,
                  borderBottom: `2px solid ${TYPE_ACCENT[t]}`,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: TYPE_ACCENT[t],
                  }}
                />
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#2a2859",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {RESOURCE_TYPE_LABELS[t]}s
                </h2>
                <span style={{ fontSize: 13, color: "#9a9a9a" }}>
                  {bucket.length} {bucket.length === 1 ? "entry" : "entries"}
                </span>
              </header>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {bucket.map((r) => (
                  <ResourceCard key={r.id} resource={r} links={links?.[r.id]} storiesById={storiesById} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
        fontFamily: FONT_STACK,
      }}
    >
      {resources.map((r) => (
        <ResourceCard key={r.id} resource={r} links={links?.[r.id]} storiesById={storiesById} />
      ))}
    </div>
  );
}

function ResourceCard({
  resource,
  links,
  storiesById,
}: {
  resource: PublicResource;
  links?: { stories: string[]; frictions: CareFriction[]; qualities: CareQuality[] };
  storiesById?: Record<string, PublicStory>;
}) {
  const accent = TYPE_ACCENT[resource.type];
  const [storiesOpen, setStoriesOpen] = useState(false);
  const linkedStoryIds = links?.stories ?? [];
  const linkedStories = linkedStoryIds
    .map((id) => storiesById?.[id])
    .filter((s): s is PublicStory => Boolean(s));

  const CardBody = (
    <>
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: accent,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            padding: "2px 10px",
            borderRadius: 4,
            background: accent + "15",
            color: accent,
          }}
        >
          {RESOURCE_TYPE_LABELS[resource.type]}
        </span>
        {resource.year && (
          <span style={{ fontSize: 12, color: "#9a9a9a" }}>{resource.year}</span>
        )}
      </div>

      <h3
        style={{
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.25,
          marginBottom: 16,
          color: "#2a2859",
          letterSpacing: "-0.01em",
        }}
      >
        {resource.title}
      </h3>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "#2c2c2c",
          marginBottom: 16,
        }}
      >
        {resource.description}
      </p>

      {links && (links.frictions.length > 0 || links.qualities.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {links.frictions.map((f) => {
            const color = FRICTIONS[f]?.color ?? "#808080";
            return (
              <span
                key={`f-${f}`}
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: color + "18",
                  color,
                  fontWeight: 500,
                }}
              >
                {FRICTIONS[f]?.label ?? f}
              </span>
            );
          })}
          {links.qualities.map((q) => {
            const color = QUALITIES[q]?.color ?? "#808080";
            return (
              <span
                key={`q-${q}`}
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: color + "18",
                  color,
                  fontWeight: 500,
                }}
              >
                {QUALITIES[q]?.label ?? q}
              </span>
            );
          })}
        </div>
      )}

      {linkedStories.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setStoriesOpen((v) => !v);
            }}
            style={{
              fontFamily: FONT_STACK,
              fontSize: 12,
              color: "#1f42aa",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Linked insights · {linkedStories.length} {storiesOpen ? "−" : "+"}
          </button>
          {storiesOpen && (
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {linkedStories.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/story/${s.id}`}
                    style={{ fontSize: 12, color: "#2a2859", textDecoration: "underline" }}
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#666666" }}>
          {resource.authors}
          {resource.authors && resource.field_site && " · "}
          {resource.field_site}
        </span>
        {resource.url && (
          <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>Open →</span>
        )}
      </div>
    </>
  );

  if (resource.url) {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "relative",
          display: "block",
          padding: 24,
          background: "#ffffff",
          border: "1px solid #e6e6e6",
          borderRadius: 8,
          textDecoration: "none",
          color: "#2c2c2c",
          overflow: "hidden",
        }}
      >
        {CardBody}
      </a>
    );
  }

  return (
    <article
      style={{
        position: "relative",
        display: "block",
        padding: 24,
        background: "#ffffff",
        border: "1px solid #e6e6e6",
        borderRadius: 8,
        color: "#2c2c2c",
        overflow: "hidden",
      }}
    >
      {CardBody}
    </article>
  );
}
