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
  { key: "mapping",      label: "Mapping",      color: "#2a2859" },
  { key: "ideation",     label: "Ideation",     color: "#1f42aa" },
  { key: "prototyping",  label: "Prototyping",  color: "#4a8a83" },
  { key: "testing",      label: "Testing",      color: "#f9c66b" },
  { key: "implementing", label: "Implementing", color: "#034b45" },
];

export interface SeedSolution extends Pick<PublicDesignResponse, "id" | "title" | "frictions" | "stage" | "outcome"> {
  description: string;
  source_stories: string[];
}

// Story IDs here reference the seed story ids in seed-data.ts.
export const SEED_SOLUTIONS: SeedSolution[] = [
  {
    id: "sol-1",
    title: "Guest mode for security alarms",
    description:
      "Prototyping a configurable setting that adjusts motion sensor sensitivity during family visits, without compromising safety protocols.",
    stage: "prototyping",
    frictions: ["script", "displace"],
    outcome: "",
    source_stories: ["seed-micro-2"],
  },
  {
    id: "sol-2",
    title: "Extended dietary care profiles",
    description:
      "Co-designing care profiles with families that go beyond medical categories — capturing cultural food practices, preferred preparations, and family cooking schedules.",
    stage: "ideation",
    frictions: ["reduce", "rotate"],
    outcome: "",
    source_stories: ["seed-meso-3", "seed-micro-6"],
  },
  {
    id: "sol-3",
    title: "Family care dashboard for transnational relatives",
    description:
      "A lightweight interface giving remote family members appropriate visibility into care plans and the ability to contribute observations.",
    stage: "mapping",
    frictions: ["invisible", "exclude"],
    outcome: "",
    source_stories: ["seed-micro-4", "seed-micro-3"],
  },
  {
    id: "sol-4",
    title: "Night-shift dignity pilot",
    description:
      "Testing a small team of on-call night visits in Alna east, paired with passive sensors — lowering the threshold at which night support is provided without forcing residents into diapers or residential care.",
    stage: "testing",
    frictions: ["isolate", "displace"],
    outcome: "",
    source_stories: ["seed-meso-8"],
  },
  {
    id: "sol-5",
    title: "Interpreter-aware scheduling",
    description:
      "Mapping how the municipal scheduling system can block-book interpreters alongside care reviews, preventing the mismatches that leave residents nodding through decisions they don't understand.",
    stage: "mapping",
    frictions: ["exclude", "reduce"],
    outcome: "",
    source_stories: ["seed-meso-7", "seed-macro-4"],
  },
];
