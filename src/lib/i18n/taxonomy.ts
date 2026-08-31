/**
 * Locale-aware project taxonomy.
 *
 * `src/lib/constants.ts` stays the single source of truth for keys and colours
 * and keeps its Norwegian text — the editing tools in /admin read it directly
 * and are not translated. This module layers the English wording on top of that
 * same structure, so a new friction or quality is added in exactly one place
 * and only its English string belongs here.
 */

import {
  FRICTIONS,
  QUALITIES,
  QUALITY_COPY,
  RESOURCE_TYPE_LABELS,
  SCALES,
  STAGES,
  WORK_PACKAGE_INFO,
  WP_LABELS,
  type SolutionStage,
  type WorkPackageId,
  type WpId,
} from "@/lib/constants";
import type { ThreadStatus } from "@/lib/threads";
import type { CareFriction, CareQuality, MapScale, ResourceType } from "@/lib/types";
import type { Locale } from "./config";

// ─── English text ───

type FrictionText = { label: string; description: string; longDescription: string; examples: string[] };

const EN_FRICTIONS: Record<CareFriction, FrictionText> = {
  rotate: {
    label: "Rotation",
    description: "Staff change constantly.",
    longDescription:
      "The resident meets a new home-care worker again and again. Trust, routines and knowledge of the person have to be rebuilt on every shift. Use this friction when the problem is that there is no one — or no small group — the resident deals with over time.",
    examples: [
      "A resident has twelve different home helpers over three months.",
      "Every new shift has to be told about the diet, the prayer times and where the medicines are kept.",
    ],
  },
  script: {
    label: "Script",
    description: "Technology or protocols assume the wrong user.",
    longDescription:
      "Sensors, alarms, forms and routines are built around one kind of user — typically someone living alone with fixed habits. When the resident's everyday life does not fit that template, the tool produces errors instead of help. Use this friction when the problem lies in the design itself.",
    examples: [
      "The motion sensor raises an alarm every night when the daughter visits.",
      "The medicine dispenser sits in the middle of the prayer room and has to be moved five times a day.",
    ],
  },
  isolate: {
    label: "Isolation",
    description: "Measures cut the resident's social ties.",
    longDescription:
      "Decisions, services or changes in the neighbourhood weaken the resident's contact with family, neighbours or community. Use this friction when a measure — or the absence of one — shrinks the social network, not when the service simply has the wrong content.",
    examples: [
      "The bus route connecting the district to the hospital is discontinued.",
      "Home care no longer offers to accompany anyone to the allotment garden.",
    ],
  },
  reduce: {
    label: "Reduction",
    description: "Categories are too coarse to capture the situation.",
    longDescription:
      "Assessment forms, codes, tick-boxes or algorithms force a complex everyday life into ready-made options. Whatever does not fit a box is misread or made invisible. Use this friction when the categories a service works with do not describe what is actually happening.",
    examples: [
      "«Halal diet» as a single tick-box says nothing about what the person actually eats.",
      "The algorithm for care hours measures mobility, but not loneliness or language barriers.",
    ],
  },
  exclude: {
    label: "Exclusion",
    description: "Requirements shut people out of services they are entitled to.",
    longDescription:
      "Norwegian-language requirements, digital forms, opening hours, meeting places or unwritten rules keep the resident from reaching services they have a right to. Often there is no rejection at all — the resident never applies, because the threshold is too high or the information never arrives. Use this friction when the problem is how the service is made available.",
    examples: [
      "Letters from NAV assume fluent Norwegian and a digital signature.",
      "The interpreter is booked for Wednesday; the care meeting is on Tuesday.",
    ],
  },
  invisible: {
    label: "Invisibility",
    description: "Care that is recorded nowhere.",
    longDescription:
      "Work done by relatives, neighbours, volunteers or family in other countries never enters municipal records or plans. The system plans as if this work did not exist. Use this friction when the situation concerns care that genuinely happens but is invisible to the services.",
    examples: [
      "The daughter in Lahore who calls every evening to remind him about his medicines.",
      "The imam who knows the medication plan better than the home-care service does.",
    ],
  },
  displace: {
    label: "Displacement",
    description: "Measures make the resident feel less at home.",
    longDescription:
      "Safety locks, monitoring, fixed routines and other measures meant as reassurance are experienced as violation, confinement or estrangement. The home stops feeling like one's own. Use this friction when the service undermines the very sense of being at home.",
    examples: [
      "A bathroom door that locks from the outside reminds a man of his time in an asylum centre.",
      "The new home helper asks for the kitchen radio to be turned off.",
    ],
  },
};

type QualityText = { label: string; longDescription: string; examples: string[] };

const EN_QUALITIES: Record<CareQuality, QualityText> = {
  transnational_flow: {
    label: "Transnational flow",
    longDescription:
      "Care, money, advice or practical help arrive from family in other countries. These ties are often decisive for everyday life, yet they never appear in municipal care plans. Use this quality when support crosses borders.",
    examples: [
      "Daily video calls with a daughter in Nairobi about medication.",
      "A sister in Lahore coordinates GP appointments from abroad.",
    ],
  },
  household_choreography: {
    label: "Household choreography",
    longDescription:
      "Rooms in the home are used interchangeably depending on the time of day and who is present. The living room may be a prayer room, the kitchen a meeting place, the sofa a sickbed. Use this quality when the function and use of rooms shift through the day.",
    examples: [
      "The medicine dispenser is moved five times a day to make room for prayer.",
      "Beds and bedrooms are swapped around when family visits.",
    ],
  },
  invisible_labor: {
    label: "Invisible labour",
    longDescription:
      "Unpaid care carried out by relatives, neighbours or volunteers — recorded nowhere. This work is often what holds the situation at home together. Use this quality when a large share of the care happens without compensation or recognition.",
    examples: [
      "A daughter sorts unopened letters from NAV every other weekend.",
      "The pensioner in the next stairwell does the grocery run every Friday.",
    ],
  },
  cultural_anchoring: {
    label: "Cultural anchoring",
    longDescription:
      "Food, prayer, language, music or rituals that are central to who the resident is. Services that make room for these practices work better than those that do not. Use this quality when cultural practice is decisive for everyday life.",
    examples: [
      "The kitchen radio always tuned to an Ethiopian station.",
      "Particular spices and preparations that are familiar — not just «halal».",
    ],
  },
  adaptive_resistance: {
    label: "Adaptive resistance",
    longDescription:
      "The resident works around, adjusts or refuses services that do not fit. In the records it usually reads as «non-compliance», but it is a deliberate strategy. Use this quality when the resident takes action themselves to make everyday life work.",
    examples: [
      "The sensor is switched off when the daughter is visiting.",
      "The resident walks to the mosque when the home visit runs late.",
    ],
  },
  intergenerational_exchange: {
    label: "Intergenerational exchange",
    longDescription:
      "Help and care travel both ways between young and old. Grandchildren fix technology; grandparents mind children and pass on language. Use this quality when the situation is about mutual support across generations.",
    examples: [
      "The 11-year-old is IT support for their grandmother's medicine dispenser.",
      "The grandfather collects the grandchildren from after-school care and teaches them Tigrinya.",
    ],
  },
  digital_bridging: {
    label: "Digital bridging",
    longDescription:
      "Technology that actually works to keep contact across distance — video calls, voice messages, translation apps. Usually tools the resident chose themselves (WhatsApp, Messenger) rather than what the municipality offers. Use this quality when digital tools are what keep connections alive.",
    examples: [
      "A living-room table with a tablet, a pill organiser labelled in Somali, and a dictionary.",
      "Voice messages in the mother tongue when writing is not enough.",
    ],
  },
  belonging_negotiation: {
    label: "Negotiating belonging",
    longDescription:
      "The question of whether the resident will stay in Norway, return «home» to their country of origin, or live in both. Many have no single settled answer. Use this quality when the situation is about where the person belongs.",
    examples: [
      "A living-room table that maps a care network across three continents.",
      "The question «where do you want to be buried?» surfaces in a care assessment.",
    ],
  },
};

const EN_QUALITY_COPY: Record<CareQuality, string> = {
  transnational_flow: "Care circulating across borders",
  household_choreography: "Daily orchestration of multi-purpose rooms",
  invisible_labor: "Unpaid care from relatives and community",
  cultural_anchoring: "Practices that sustain identity",
  adaptive_resistance: "Quiet adaptations around the services",
  intergenerational_exchange: "Mutual care between young and old",
  digital_bridging: "Technology that keeps connections alive",
  belonging_negotiation: "The tension between here and there",
};

const EN_SCALES: Record<MapScale, { label: string; longDescription: string }> = {
  micro: {
    label: "The home",
    longDescription:
      "Observations inside one particular home — the rooms, the objects, the routines, the resident's daily life. Use this scale when the situation could point to a specific room or a specific person.",
  },
  meso: {
    label: "The services",
    longDescription:
      "Observations in the district and its services or meeting places — GP surgeries, pharmacies, libraries, mosques, home care, volunteering. Use this scale when the situation is about how a service or institution works.",
  },
  macro: {
    label: "The system",
    longDescription:
      "Observations at the level of systems and policy — decisions, budgets, regulations, digital platforms, and the transnational ties in WP3. Use this scale when the cause lies in a decision or structure that affects many.",
  },
};

const EN_WP_LABELS: Record<WpId, { label: string; subtitle: string; longDescription: string }> = {
  wp1: {
    label: "WP1: Homes & Communities",
    subtitle: "the home, its rooms and the immediate community",
    longDescription:
      "Micro level. The home and the surrounding neighbourhood — the rooms, objects, routines and relationships that make up the resident's everyday life. Use WP1 when the insight is about what happens in and around a dwelling. Led by Carolina Rau (UiO).",
  },
  wp2: {
    label: "WP2: Health & Care Institutions",
    subtitle: "GPs, home care, nursing homes and the road there",
    longDescription:
      "Meso level. How the service apparatus actually works — GP, home care, short-term places, health clinics — and how easy (or hard) it is for older people with an immigrant background to use it. Use WP2 when the insight is about a service or an institution. Led by Jonas Debesay (OsloMet).",
  },
  wp3: {
    label: "WP3: Transnational Contexts",
    subtitle: "ties to family, property and care across borders",
    longDescription:
      "Family, care, economy and politics that cross national borders, and how they meet Norwegian services and administration. Use WP3 when the insight reaches beyond Norway. Led by Erika Gubrium (OsloMet).",
  },
  wp4: {
    label: "WP4: Innovation & Design",
    subtitle: "concrete measures developed with residents and municipalities",
    longDescription:
      "Cross-cutting. Takes findings from the other work packages and develops concrete measures together with residents, staff and municipal partners. Use WP4 when the insight concerns a possible solution, a pilot or a change in how the service is delivered. Led by Alejandro Miranda Nieto (OsloMet) and Øystein Evensen (Comte Bureau).",
  },
};

const EN_WORK_PACKAGE_INFO: Record<WorkPackageId, { label: string; longDescription: string }> = {
  WP1: { label: "WP1 · Homes & Communities", longDescription: EN_WP_LABELS.wp1.longDescription },
  WP2: { label: "WP2 · Health & Care Institutions", longDescription: EN_WP_LABELS.wp2.longDescription },
  WP3: { label: "WP3 · Transnational Contexts", longDescription: EN_WP_LABELS.wp3.longDescription },
  WP4: { label: "WP4 · Innovation & Design", longDescription: EN_WP_LABELS.wp4.longDescription },
};

const EN_RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  publication: "Publication",
  policy_brief: "Policy brief",
  toolkit: "Toolkit",
  practice_guide: "Practice guide",
  teaching_guide: "Teaching guide",
  experience: "Municipal experience",
};

const EN_STAGE_LABELS: Record<SolutionStage, string> = {
  mapping: "Mapping",
  ideation: "Ideation",
  prototyping: "Prototyping",
  testing: "Testing",
  implementing: "Implementation",
};

// Duplicated rather than imported from `@/lib/threads`: that module creates the
// Supabase browser client at import time, and taxonomy is read by server
// components too.
const NO_THREAD_STATUS: Record<ThreadStatus, string> = {
  open: "Åpen",
  parked: "Parkert",
  landed: "Landet",
};

const EN_THREAD_STATUS: Record<ThreadStatus, string> = {
  open: "Open",
  parked: "Parked",
  landed: "Landed",
};

// ─── Merged, colour-preserving views ───

function mergeText<K extends string, N extends { color: string }, T extends object>(
  base: Record<K, N>,
  text: Record<K, T>,
): Record<K, N & T> {
  const out = {} as Record<K, N & T>;
  for (const key of Object.keys(base) as K[]) {
    out[key] = { ...base[key], ...text[key] };
  }
  return out;
}

const FRICTIONS_EN = mergeText(FRICTIONS, EN_FRICTIONS);
const QUALITIES_EN = mergeText(QUALITIES, EN_QUALITIES);

const SCALES_EN = EN_SCALES;

const STAGES_EN = STAGES.map((s) => ({ ...s, label: EN_STAGE_LABELS[s.key] }));

export type Taxonomy = {
  frictions: typeof FRICTIONS;
  qualities: typeof QUALITIES;
  qualityCopy: Record<CareQuality, string>;
  scales: typeof SCALES;
  stages: typeof STAGES;
  wpLabels: typeof WP_LABELS;
  workPackageInfo: typeof WORK_PACKAGE_INFO;
  resourceTypeLabels: Record<ResourceType, string>;
  threadStatus: Record<ThreadStatus, string>;
};

const TAXONOMY: Record<Locale, Taxonomy> = {
  no: {
    frictions: FRICTIONS,
    qualities: QUALITIES,
    qualityCopy: QUALITY_COPY,
    scales: SCALES,
    stages: STAGES,
    wpLabels: WP_LABELS,
    workPackageInfo: WORK_PACKAGE_INFO,
    resourceTypeLabels: RESOURCE_TYPE_LABELS,
    threadStatus: NO_THREAD_STATUS,
  },
  en: {
    frictions: FRICTIONS_EN,
    qualities: QUALITIES_EN,
    qualityCopy: EN_QUALITY_COPY,
    scales: SCALES_EN,
    stages: STAGES_EN,
    wpLabels: EN_WP_LABELS,
    workPackageInfo: EN_WORK_PACKAGE_INFO,
    resourceTypeLabels: EN_RESOURCE_TYPE_LABELS,
    threadStatus: EN_THREAD_STATUS,
  },
};

export function getTaxonomy(lang: Locale): Taxonomy {
  return TAXONOMY[lang];
}
