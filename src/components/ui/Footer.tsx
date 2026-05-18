import { clay, space, typography } from "@/lib/design-tokens";

const RESEARCH_PARTNERS = [
  "OsloMet",
  "Universitetet i Oslo",
  "Durham University",
  "Comte Bureau",
];

const MUNICIPALITIES = [
  "Bydel Alna",
  "Bydel Søndre Nordstrand",
];

export function Footer() {
  return (
    <footer
      style={{
        marginTop: space.s96,
        background: clay.colors.surfaceSoft,
        fontFamily: clay.font.body,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: `80px ${space.s24}`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: space.s40,
          color: clay.colors.muted,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: clay.font.display,
              fontSize: "32px",
              fontWeight: 500,
              letterSpacing: "-0.5px",
              color: clay.colors.ink,
              marginBottom: space.s16,
            }}
          >
            safe@home
          </p>
          <p style={{ ...typography.sizes.t14, color: clay.colors.body, maxWidth: "30ch", lineHeight: 1.55 }}>
            Forskningsplattform om aldring, omsorg og teknologi i reformen Bo trygt hjemme.
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: clay.colors.muted,
              marginBottom: space.s12,
            }}
          >
            Forskningspartnere
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s4, ...typography.sizes.t14, color: clay.colors.body }}>
            {RESEARCH_PARTNERS.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: clay.colors.muted,
              marginBottom: space.s12,
            }}
          >
            Kommunepartnere
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s4, ...typography.sizes.t14, color: clay.colors.body }}>
            {MUNICIPALITIES.map(m => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
