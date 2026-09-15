"use client";

import Link from "next/link";
import type { CorpusNode } from "@/lib/corpus";
import { clay } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * The colorful card used for corpus items (notes/insights/resources) on both
 * /internal and /internal/content. One saturated Clay accent per card, cycled
 * pink → teal → lavender → peach → ochre → cream — see .claude/design-clay.md
 * "Iteration Guide". Pink and teal are dark enough to need light (onPrimary)
 * text and pill fills; the rest read fine with ink text on a translucent-ink
 * pill.
 */
const PALETTE: { bg: string; ink: string; muted: string; pill: string }[] = [
  { bg: clay.colors.pink, ink: clay.colors.onPrimary, muted: "rgba(255, 255, 255, 0.78)", pill: "rgba(255, 255, 255, 0.18)" },
  { bg: clay.colors.teal, ink: clay.colors.onPrimary, muted: "rgba(255, 255, 255, 0.7)", pill: "rgba(255, 255, 255, 0.16)" },
  { bg: clay.colors.lavender, ink: clay.colors.ink, muted: "rgba(10, 10, 10, 0.65)", pill: "rgba(10, 10, 10, 0.08)" },
  { bg: clay.colors.peach, ink: clay.colors.ink, muted: "rgba(10, 10, 10, 0.65)", pill: "rgba(10, 10, 10, 0.08)" },
  { bg: clay.colors.ochre, ink: clay.colors.ink, muted: "rgba(10, 10, 10, 0.65)", pill: "rgba(10, 10, 10, 0.08)" },
  { bg: clay.colors.surfaceCard, ink: clay.colors.ink, muted: clay.colors.muted, pill: "rgba(10, 10, 10, 0.06)" },
];

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export interface InsightCardProps {
  node: CorpusNode;
  /** Picks the accent from PALETTE — pass a running index so neighbouring cards don't repeat a color. */
  colorIndex: number;
  /** Opens the node in-place (detail panel). Mutually exclusive with `href`. */
  onOpen?: () => void;
  /** Navigates instead of opening a panel. */
  href?: string;
}

export default function InsightCard({ node, colorIndex, onOpen, href }: InsightCardProps) {
  const { t, tax, intlLocale } = useI18n();
  const c = PALETTE[colorIndex % PALETTE.length];
  const tilt = colorIndex % 2 === 0 ? "insight-card--tilt-a" : "insight-card--tilt-b";

  const preview = node.body.replace(/\s+/g, " ").trim().slice(0, 140);
  const meta = node.authors ?? (node.createdAt ? formatDate(node.createdAt, intlLocale) : null);

  const rawTags: string[] = [];
  if (node.resourceType) rawTags.push(tax.resourceTypeLabels[node.resourceType]);
  if (node.mapScale) rawTags.push(tax.scales[node.mapScale].label);
  if (node.workPackage) rawTags.push(node.workPackage);
  for (const f of node.frictions) rawTags.push(tax.frictions[f].label);
  for (const q of node.qualities) rawTags.push(tax.qualities[q].label);
  const shownTags = rawTags.slice(0, 4);
  const extra = rawTags.length - shownTags.length;

  const body = (
    <>
      <span className="insight-card__kind" style={{ background: c.pill, color: c.ink }}>
        {t.browser.kinds[node.kind]}
      </span>
      <h3 className="insight-card__title" style={{ color: c.ink }}>
        {node.title}
      </h3>
      {meta && (
        <p className="insight-card__authors" style={{ color: c.muted }}>
          {meta}
        </p>
      )}
      {preview && (
        <p className="insight-card__preview" style={{ color: c.ink }}>
          {preview}
          {node.body.length > 140 ? "…" : ""}
        </p>
      )}
      {shownTags.length > 0 && (
        <div className="insight-card__tags">
          {shownTags.map((label, i) => (
            <span key={`${label}-${i}`} className="insight-card__tag" style={{ background: c.pill, color: c.ink }}>
              {label}
            </span>
          ))}
          {extra > 0 && (
            <span className="insight-card__tag" style={{ background: c.pill, color: c.ink }}>
              +{extra}
            </span>
          )}
        </div>
      )}
    </>
  );

  const className = `insight-card ${tilt}`;

  if (href) {
    return (
      <Link href={href} className={className} style={{ background: c.bg }}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onOpen} className={className} style={{ background: c.bg }}>
      {body}
    </button>
  );
}
