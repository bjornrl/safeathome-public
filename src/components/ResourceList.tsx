import type { PublicResource, ResourceType } from "@/lib/types";
import { RESOURCE_TYPE_LABELS } from "@/lib/seed-resources";

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
}: {
  resources: PublicResource[];
  emptyMessage: string;
  groupByType?: boolean;
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
                  <ResourceCard key={r.id} resource={r} />
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
        <ResourceCard key={r.id} resource={r} />
      ))}
    </div>
  );
}

function ResourceCard({ resource }: { resource: PublicResource }) {
  const accent = TYPE_ACCENT[resource.type];
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
