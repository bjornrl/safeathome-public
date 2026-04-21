import type { PublicResource, ResourceType } from "@/lib/types";
import { RESOURCE_TYPE_LABELS } from "@/lib/seed-resources";

const TYPE_ACCENT: Record<ResourceType, string> = {
  publication:    "#5B6AAF",
  policy_brief:   "#C45D3E",
  teaching_guide: "#3A8A7D",
  toolkit:        "#8B6914",
  practice_guide: "#9B59B6",
  experience:     "#D4A017",
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
          fontFamily: "var(--font-source-serif)",
          fontStyle: "italic",
          fontSize: 17,
          color: "#7A756B",
        }}
      >
        {emptyMessage}
      </p>
    );
  }

  if (groupByType) {
    const types = Array.from(new Set(resources.map((r) => r.type))) as ResourceType[];
    return (
      <div style={{ display: "grid", gap: 48 }}>
        {types.map((t) => {
          const bucket = resources.filter((r) => r.type === t);
          return (
            <section key={t}>
              <header
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 18,
                  paddingBottom: 10,
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
                    fontFamily: "var(--font-source-serif)",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#2C2A25",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {RESOURCE_TYPE_LABELS[t]}s
                </h2>
                <span style={{ fontSize: 13, color: "#A09A8E" }}>
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
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            padding: "2px 10px",
            borderRadius: 99,
            background: accent + "15",
            color: accent,
          }}
        >
          {RESOURCE_TYPE_LABELS[resource.type]}
        </span>
        {resource.year && (
          <span style={{ fontSize: 12, color: "#A09A8E" }}>{resource.year}</span>
        )}
      </div>

      <h3
        style={{
          fontFamily: "var(--font-source-serif)",
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.25,
          marginBottom: 10,
          color: "#2C2A25",
        }}
      >
        {resource.title}
      </h3>

      <p
        style={{
          fontFamily: "var(--font-source-serif)",
          fontSize: 15,
          lineHeight: 1.55,
          color: "#2C2A25",
          marginBottom: 14,
        }}
      >
        {resource.description}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#7A756B" }}>
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
          background: "#fff",
          border: "1px solid #E8E4DB",
          borderRadius: 14,
          textDecoration: "none",
          color: "#2C2A25",
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
        background: "#fff",
        border: "1px solid #E8E4DB",
        borderRadius: 14,
        color: "#2C2A25",
        overflow: "hidden",
      }}
    >
      {CardBody}
    </article>
  );
}
