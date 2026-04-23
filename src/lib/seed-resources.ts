import type { PublicResource, ResourceType } from "./types";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  publication:     "Publication",
  policy_brief:    "Policy brief",
  toolkit:         "Toolkit",
  practice_guide:  "Practice guide",
  teaching_guide:  "Teaching guide",
  experience:      "Municipal experience",
};

export const READING_ROOM_TYPES: ResourceType[] = [
  "publication",
  "policy_brief",
  "teaching_guide",
];

export const MUNICIPAL_TYPES: ResourceType[] = [
  "toolkit",
  "practice_guide",
  "experience",
];

function resource(
  id: string,
  title: string,
  description: string,
  type: ResourceType,
  url: string,
  authors: string | null,
  year: number | null,
  field_site: PublicResource["field_site"] = null,
): PublicResource {
  return {
    id,
    title,
    description,
    type,
    url,
    authors,
    year,
    field_site,
    theme: null,
    published: true,
    created_at: "2026-01-01",
  };
}

export const SEED_RESOURCES: PublicResource[] = [
  // ─── Reading room: publications + policy briefs + teaching guides ───
  resource(
    "res-pub-1",
    "Aging in place, aging in translation",
    "Working paper on how transnational households reshape the assumptions behind Norway's homecare reform. Part of the WP3 series on cross-border care coordination.",
    "publication",
    "https://safeathome.research/publications/aging-in-translation.pdf",
    "safe@home research team",
    2026,
    null,
  ),
  resource(
    "res-pub-2",
    "The care script: welfare technology and the assumed household",
    "Ethnographic analysis of how motion sensors, medicine dispensers, and emergency alarms encode a specific image of the household — one person, fixed routines, predictable visitors.",
    "publication",
    "https://safeathome.research/publications/care-script.pdf",
    "OsloMet · University of Oslo",
    2026,
    null,
  ),
  resource(
    "res-brief-1",
    "Policy brief: interpreter access in elderly homecare",
    "Two-page brief summarizing the scheduling mismatches, phone-vs-in-person debates, and municipal budget decisions that shape interpreter availability for aging immigrants.",
    "policy_brief",
    "https://safeathome.research/briefs/interpreter-access.pdf",
    "safe@home research team",
    2026,
    "Alna",
  ),
  resource(
    "res-brief-2",
    "Policy brief: night-shift coverage gaps",
    "Short briefing on the dignity costs of night-care thresholds set above the needs of elderly residents — and on pilot approaches being tested in Alna east.",
    "policy_brief",
    "https://safeathome.research/briefs/night-coverage.pdf",
    "safe@home research team",
    2026,
    "Alna",
  ),
  resource(
    "res-teach-1",
    "Teaching guide: ethnographies of homecare",
    "Seminar guide for nursing and social-work programmes, built around five anonymized safe@home field vignettes. Includes discussion prompts and positionality exercises.",
    "teaching_guide",
    "https://safeathome.research/teaching/ethnographies-of-homecare.pdf",
    "Durham University · OsloMet",
    2026,
    null,
  ),

  // ─── For municipalities: toolkits + practice guides + experiences ───
  resource(
    "res-toolkit-1",
    "Culturally aware care-plan template",
    "Editable template for homecare plans that captures dietary practices, prayer rhythms, transnational support, and language preferences beyond checkbox categories.",
    "toolkit",
    "https://safeathome.research/toolkits/culturally-aware-careplan.docx",
    "Comte Bureau · safe@home",
    2026,
    null,
  ),
  resource(
    "res-toolkit-2",
    "Interpreter-aware scheduling checklist",
    "A one-page checklist helping care coordinators block interpreters alongside quarterly care reviews, lowering the frequency of mismatches and signed-off-on-nodding reviews.",
    "toolkit",
    "https://safeathome.research/toolkits/interpreter-scheduling.pdf",
    "safe@home research team",
    2026,
    null,
  ),
  resource(
    "res-practice-1",
    "Practice guide: welfare technology deployment",
    "Practice-facing guide for installing motion sensors, medicine dispensers, and alarms in multi-generational households. Includes consent conversation prompts.",
    "practice_guide",
    "https://safeathome.research/practice/welfare-tech.pdf",
    "OsloMet · Comte Bureau",
    2026,
    null,
  ),
  resource(
    "res-exp-alna",
    "Alna: night-shift dignity pilot",
    "Field-level account from Alna east of the small on-call night team paired with passive sensors. Includes what worked, what broke, and the scheduling compromises that made it feasible.",
    "experience",
    "https://safeathome.research/experiences/alna-night-pilot",
    "Alna District",
    2026,
    "Alna",
  ),
  resource(
    "res-exp-sn",
    "Søndre Nordstrand: library reading circle",
    "An account of the Holmlia library circle becoming an informal language and belonging space. Describes how the municipality quietly supported it without folding it into a service line.",
    "experience",
    "https://safeathome.research/experiences/holmlia-library",
    "Søndre Nordstrand District",
    2026,
    "Søndre Nordstrand",
  ),
];
