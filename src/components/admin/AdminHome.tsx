"use client";

import Link from "next/link";
import { useState } from "react";
import { colors, radius, space, typography } from "@/lib/design-tokens";
import { FRICTIONS, QUALITIES, WP_LABELS, type WpId } from "@/lib/constants";
import type { CareFriction, CareQuality } from "@/lib/types";

const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];
const WP_IDS = Object.keys(WP_LABELS) as WpId[];

const MAX_W = "820px";

// Qualities only carry a longDescription; show its first sentence in the
// compact category list. Frictions have a purpose-built short description.
const firstSentence = (s: string): string => {
  const m = s.match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : s).trim();
};

export function AdminHome({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  return (
    <div style={{ fontFamily: typography.fontFamily, color: colors.textBody, maxWidth: MAX_W }}>
      {/* ── Welcome ── */}
      <section style={{ marginBottom: space.s48 }}>
        <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Velkommen</p>
        <h2 style={{ ...typography.sizes.t26, fontWeight: typography.weights.bold, letterSpacing: "-0.01em", margin: `0 0 ${space.s16}` }}>
          Dette er arbeidsbenken for SAFE@HOME.
        </h2>
        <p style={{ ...typography.sizes.t18, color: colors.textBody, lineHeight: 1.6, marginBottom: space.s12 }}>
          Her samler vi materialet fra feltarbeidet — observasjoner, ferdige
          innsikter, designutfordringer og ressurser. Alt du skriver lagres i
          prosjektets database og blir tilgjengelig for resten av teamet, i
          nodekartet og i det semantiske søket.
        </p>
        <p style={{ ...typography.sizes.t16, color: colors.textMuted, lineHeight: 1.6 }}>
          Er du usikker på hvor du skal begynne? Start med et hurtignotat fra
          feltet, og merk det med kategoriene under. Resten bygger seg opp
          derfra.
        </p>
      </section>

      {/* ── How it works ── */}
      <section style={{ marginBottom: space.s48 }}>
        <SectionTitle>Slik henger det sammen</SectionTitle>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s12 }}>
          <Step n={1} title="Hurtignotater" onClick={onOpenTab ? () => onOpenTab("notes") : undefined}>
            Korte observasjoner og spørsmål rett fra feltet. Merk med arbeidspakke,
            friksjon, kvalitet, tema og sted — da dukker notatet opp i nodekartet og
            i AI-forslagene. AI-assistenten foreslår både kategorier og beslektede
            notater mens du skriver.
          </Step>
          <Step n={2} title="Innsikter" onClick={onOpenTab ? () => onOpenTab("stories") : undefined}>
            Ferdige, publiserte funn — det som blir det offentlige historiekartet.
            Knytt en innsikt til arbeidspakken, feltstedet og friksjonene/kvalitetene
            den illustrerer, og trekk typede koblinger mellom innsikter.
          </Step>
          <Step n={3} title="Designutfordringer" onClick={onOpenTab ? () => onOpenTab("challenges") : undefined}>
            Åpne problemer designteamet jobber med, basert på én eller flere innsikter.
            Beveger seg gjennom fasene: rammer inn → utforsker → tester → tatt i bruk.
          </Step>
          <Step n={4} title="Ressurser" onClick={onOpenTab ? () => onOpenTab("resources") : undefined}>
            Publikasjoner, verktøykasser, policy-notater og guider for lesesalen.
            Koble til innsiktene de hører sammen med, så vises de på de matchende
            offentlige sidene.
          </Step>
        </ol>
      </section>

      {/* ── Categories ── */}
      <section style={{ marginBottom: space.s48 }}>
        <SectionTitle>Kategoriene — og hvorfor vi bruker dem</SectionTitle>
        <p style={{ ...typography.sizes.t16, color: colors.textMuted, lineHeight: 1.6, marginBottom: space.s32 }}>
          Konsekvent merking er det som gjør materialet søkbart og koblbart. Når vi
          merker likt, kan vi se mønstre på tvers av felt og forskere: friksjoner og
          kvaliteter binder enkeltobservasjoner til analysen, arbeidspakkene plasserer
          dem i prosjektets struktur, og nodekartet og søket finner sammenhenger vi
          ellers ville gått glipp av. Velg heller få kategorier du er trygg på enn
          mange usikre.
        </p>

        <CategoryGroup
          title="Arbeidspakker"
          lead="Hvor i prosjektet observasjonen hører hjemme."
        >
          {WP_IDS.map((id) => (
            <CategoryRow
              key={id}
              dot={colors.brandDarkBlue}
              label={WP_LABELS[id].label}
              desc={WP_LABELS[id].subtitle}
            />
          ))}
        </CategoryGroup>

        <CategoryGroup
          title="Friksjoner"
          lead="Systemiske mekanismer som gjør at omsorgen svikter."
        >
          {FRICTION_KEYS.map((k) => (
            <CategoryRow
              key={k}
              dot={FRICTIONS[k].color}
              label={FRICTIONS[k].label}
              desc={FRICTIONS[k].description}
            />
          ))}
        </CategoryGroup>

        <CategoryGroup
          title="Kvaliteter"
          lead="Hvordan folk faktisk lever og ordner omsorgen sin."
        >
          {QUALITY_KEYS.map((k) => (
            <CategoryRow
              key={k}
              dot={QUALITIES[k].color}
              label={QUALITIES[k].label}
              desc={firstSentence(QUALITIES[k].longDescription)}
            />
          ))}
        </CategoryGroup>

        <p style={{ ...typography.sizes.t14, color: colors.textMuted, fontStyle: "italic", marginTop: space.s16 }}>
          Lengre forklaringer og eksempler på hver kategori finner du ved hjelpe­ikonet
          (?) i notat- og innsiktsskjemaene.
        </p>
      </section>

      {/* ── Contact ── */}
      <section>
        <SectionTitle>Kontakt</SectionTitle>
        <p style={{ ...typography.sizes.t16, color: colors.textMuted, lineHeight: 1.6, marginBottom: space.s24 }}>
          Står du fast i verktøyet, eller har du innspill til hvordan det bør fungere?
          Ta kontakt — helst med meg.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: space.s16 }}>
          <PrimaryContact
            name="Bjørn Ravlo-Leira"
            role="Plattform · WP4"
            org="Comte Bureau"
            email="bjorn@comte.no"
            phone="+47 95463335"
            photoSrc="/images/bjorn.jpg"
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: space.s16 }}>
            <ContactCard label="Prosjektleder (PI)" name="Marit Haldar" org="OsloMet" email="mariha@oslomet.no" />
            <ContactCard label="Plattform · WP4" name="Carolina Borges Rau Steuernagel" org="OsloMet" email="caste4774@oslomet.no" />
          </div>

          <p style={{ ...typography.sizes.t14, marginTop: space.s4 }}>
            <Link href="/about" style={{ color: colors.brandWarmBlue, fontWeight: typography.weights.medium }}>
              Se hele teamet →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Pieces ───

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        ...typography.sizes.t18,
        fontWeight: typography.weights.bold,
        color: colors.textBody,
        margin: `0 0 ${space.s16}`,
        paddingBottom: space.s8,
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}
    >
      {children}
    </h3>
  );
}

function Step({
  n,
  title,
  children,
  onClick,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <li style={{ display: "flex", gap: space.s16, alignItems: "flex-start" }}>
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: colors.brandDarkBlue,
          color: colors.textLight,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...typography.sizes.t14,
          fontWeight: typography.weights.bold,
        }}
      >
        {n}
      </span>
      <div>
        <p style={{ margin: `0 0 2px`, ...typography.sizes.t16, fontWeight: typography.weights.medium }}>
          {onClick ? (
            <button
              type="button"
              onClick={onClick}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: colors.brandWarmBlue,
                fontFamily: "inherit",
                ...typography.sizes.t16,
                fontWeight: typography.weights.medium,
              }}
            >
              {title} →
            </button>
          ) : (
            title
          )}
        </p>
        <p style={{ margin: 0, ...typography.sizes.t14, color: colors.textMuted, lineHeight: 1.6 }}>{children}</p>
      </div>
    </li>
  );
}

function CategoryGroup({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: space.s24 }}>
      <p style={{ margin: `0 0 2px`, ...typography.sizes.t16, fontWeight: typography.weights.bold }}>{title}</p>
      <p style={{ margin: `0 0 ${space.s12}`, ...typography.sizes.t14, color: colors.textMuted, fontStyle: "italic" }}>{lead}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: `${space.s8} ${space.s24}` }}>
        {children}
      </div>
    </div>
  );
}

function CategoryRow({ dot, label, desc }: { dot: string; label: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: space.s8, alignItems: "baseline" }}>
      <span
        aria-hidden
        style={{ flexShrink: 0, width: 10, height: 10, borderRadius: "50%", background: dot, transform: "translateY(1px)" }}
      />
      <span style={{ ...typography.sizes.t14, lineHeight: 1.5 }}>
        <strong style={{ fontWeight: typography.weights.medium }}>{label}.</strong>{" "}
        <span style={{ color: colors.textMuted }}>{desc}</span>
      </span>
    </div>
  );
}

function PrimaryContact({
  name,
  role,
  org,
  email,
  phone,
  photoSrc,
}: {
  name: string;
  role: string;
  org: string;
  email: string;
  phone: string;
  photoSrc: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: space.s24,
        alignItems: "center",
        flexWrap: "wrap",
        padding: space.s24,
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: radius.md,
      }}
    >
      <Photo src={photoSrc} name={name} size={84} />
      <div style={{ minWidth: "200px" }}>
        <p style={{ margin: 0, ...typography.sizes.t12, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.brandWarmBlue, fontWeight: typography.weights.bold }}>
          {role}
        </p>
        <p style={{ margin: `2px 0 0`, ...typography.sizes.t18, fontWeight: typography.weights.bold }}>{name}</p>
        <p style={{ margin: `0 0 ${space.s8}`, ...typography.sizes.t14, color: colors.textMuted }}>{org}</p>
        <p style={{ margin: 0, ...typography.sizes.t14 }}>
          <a href={`mailto:${email}`} style={{ color: colors.brandWarmBlue, fontWeight: typography.weights.medium }}>{email}</a>
          <span style={{ color: colors.borderGray }}> · </span>
          <a href={`tel:${phone.replace(/\s/g, "")}`} style={{ color: colors.brandWarmBlue, fontWeight: typography.weights.medium }}>{phone}</a>
        </p>
      </div>
    </div>
  );
}

function ContactCard({ label, name, org, email }: { label: string; name: string; org: string; email: string }) {
  return (
    <div
      style={{
        padding: space.s16,
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: radius.md,
      }}
    >
      <p style={{ margin: 0, ...typography.sizes.t12, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.textMuted, fontWeight: typography.weights.bold }}>
        {label}
      </p>
      <p style={{ margin: `4px 0 0`, ...typography.sizes.t16, fontWeight: typography.weights.medium }}>{name}</p>
      <p style={{ margin: `0 0 ${space.s8}`, ...typography.sizes.t14, color: colors.textMuted }}>{org}</p>
      <a href={`mailto:${email}`} style={{ ...typography.sizes.t14, color: colors.brandWarmBlue, fontWeight: typography.weights.medium }}>{email}</a>
    </div>
  );
}

// Photo with a graceful initials fallback — works before /images/bjorn.jpg
// exists, and shows the real photo the moment it's added to /public.
function Photo({ src, name, size }: { src: string; name: string; size: number }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (errored) {
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          background: colors.brandDarkBlue,
          color: colors.textLight,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size / 2.6),
          fontWeight: typography.weights.bold,
        }}
      >
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: `1px solid ${colors.borderSubtle}`,
      }}
    />
  );
}
