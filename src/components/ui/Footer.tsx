import { colors, space, typography } from "@/lib/design-tokens";

const RESEARCH_PARTNERS = [
  "OsloMet",
  "Universitetet i Oslo",
  "Durham University",
  "Comte Bureau",
];

const MUNICIPALITIES = [
  "Bydel Alna",
  "Bydel Søndre Nordstrand",
  "Skien kommune",
];

export function Footer() {
  return (
    <footer
      style={{
        marginTop: space.s104,
        borderTop: `1px solid ${colors.borderSubtle}`,
        background: colors.bgSubtle,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: `${space.s64} ${space.s24}`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: space.s40,
          color: colors.textMuted,
        }}
      >
        <div>
          <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>safe@home</p>
          <p style={{ ...typography.sizes.t14, color: colors.textBody, maxWidth: "30ch" }}>
            Forskningsplattform om aldring, omsorg og teknologi i reformen Bo trygt hjemme.
          </p>
        </div>
        <div>
          <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Forskningspartnere</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s4, ...typography.sizes.t14 }}>
            {RESEARCH_PARTNERS.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Kommunepartnere</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s4, ...typography.sizes.t14 }}>
            {MUNICIPALITIES.map(m => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
