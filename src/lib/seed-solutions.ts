import type { PublicDesignResponse } from "./types";

export type SolutionStage =
  | "mapping"
  | "ideation"
  | "prototyping"
  | "testing"
  | "implementing";

// Stage colors use Oslo kommune tones. Pipeline reads left-to-right:
// dark blue → warm blue → teal accent → yellow (attention) → green (shipped).
export const STAGES: { key: SolutionStage; label: string; color: string }[] = [
  { key: "mapping",      label: "Kartlegging",  color: "#2a2859" },
  { key: "ideation",     label: "Idéutvikling", color: "#1f42aa" },
  { key: "prototyping",  label: "Prototyping",  color: "#4a8a83" },
  { key: "testing",      label: "Testing",      color: "#f9c66b" },
  { key: "implementing", label: "Implementering", color: "#034b45" },
];

export interface SeedSolution extends Pick<PublicDesignResponse, "id" | "title" | "frictions" | "stage" | "outcome"> {
  description: string;
  source_stories: string[];
}

// Story IDs here reference the seed story ids in seed-data.ts.
export const SEED_SOLUTIONS: SeedSolution[] = [
  {
    id: "sol-1",
    title: "Gjestemodus for trygghetsalarmer",
    description:
      "Prototyper en konfigurerbar innstilling som justerer bevegelsessensorenes følsomhet under familiebesøk, uten å gå på akkord med sikkerheten.",
    stage: "prototyping",
    frictions: ["script", "displace"],
    outcome: "",
    source_stories: ["seed-micro-2"],
  },
  {
    id: "sol-2",
    title: "Utvidede kostholdsbaserte omsorgsprofiler",
    description:
      "Ko-design av omsorgsprofiler sammen med familier som strekker seg lenger enn medisinske kategorier — fanger opp kulturelle matpraksiser, foretrukne tilberedninger og familiens matlagingsrytmer.",
    stage: "ideation",
    frictions: ["reduce", "rotate"],
    outcome: "",
    source_stories: ["seed-meso-3", "seed-micro-6"],
  },
  {
    id: "sol-3",
    title: "Familie-dashbord for transnasjonale pårørende",
    description:
      "Et enkelt grensesnitt som gir pårørende på avstand passende innsyn i omsorgsplanen og mulighet til å bidra med observasjoner.",
    stage: "mapping",
    frictions: ["invisible", "exclude"],
    outcome: "",
    source_stories: ["seed-micro-4", "seed-micro-3"],
  },
  {
    id: "sol-4",
    title: "Verdighetspilot på nattevakt",
    description:
      "Testing av et lite vaktteam på utrykning om natta i Alna øst, kombinert med passive sensorer — senker terskelen for å få natt-støtte uten å presse beboere over på bleier eller institusjon.",
    stage: "testing",
    frictions: ["isolate", "displace"],
    outcome: "",
    source_stories: ["seed-meso-8"],
  },
  {
    id: "sol-5",
    title: "Tolkebevisst timeplanlegging",
    description:
      "Kartlegger hvordan det kommunale timesystemet kan blokk-bestille tolk samtidig med omsorgsvurderinger, slik at vi unngår mismatchene som etterlater beboere nikkende til vedtak de ikke forstår.",
    stage: "mapping",
    frictions: ["exclude", "reduce"],
    outcome: "",
    source_stories: ["seed-meso-7", "seed-macro-4"],
  },
];
