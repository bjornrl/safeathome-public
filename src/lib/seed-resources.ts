import type { PublicResource, ResourceType } from "./types";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  publication:     "Publikasjon",
  policy_brief:    "Policy-notat",
  toolkit:         "Verktøykasse",
  practice_guide:  "Praksisguide",
  teaching_guide:  "Undervisningsguide",
  experience:      "Kommunal erfaring",
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
  url: string | null,
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
    "Å eldes hjemme, å eldes i oversettelse",
    "Arbeidsnotat om hvordan transnasjonale husholdninger endrer forutsetningene bak Norges hjemmetjenestereform. Del av WP3-serien om omsorgskoordinering på tvers av landegrenser.",
    "publication",
    null,
    "safe@home-forskningsgruppen",
    2026,
    null,
  ),
  resource(
    "res-pub-2",
    "Omsorgsmanuset: velferdsteknologi og den antatte husholdningen",
    "Etnografisk analyse av hvordan bevegelsessensorer, medisindispensere og trygghetsalarmer koder for et bestemt bilde av husholdningen — én person, faste rutiner, forutsigbare besøk.",
    "publication",
    null,
    "OsloMet · Universitetet i Oslo",
    2026,
    null,
  ),
  resource(
    "res-brief-1",
    "Policy-notat: tolketilgang i eldreomsorg hjemme",
    "Tosiders notat som oppsummerer planleggingsmismatch, telefon-vs-fysisk-debattene og kommunale budsjettavgjørelser som former tolketilgangen for eldre innvandrere.",
    "policy_brief",
    null,
    "safe@home-forskningsgruppen",
    2026,
    "Alna",
  ),
  resource(
    "res-brief-2",
    "Policy-notat: hull i nattevaktdekningen",
    "Kort notat om verdighetskostnadene ved natt-omsorgsterskler satt høyere enn behovene til eldre beboere — og om pilotløsninger som testes i Alna øst.",
    "policy_brief",
    null,
    "safe@home-forskningsgruppen",
    2026,
    "Alna",
  ),
  resource(
    "res-teach-1",
    "Undervisningsguide: etnografier av hjemmebasert omsorg",
    "Seminarguide for sykepleier- og sosialarbeiderutdanninger, bygget rundt fem anonymiserte safe@home-feltvignetter. Inkluderer diskusjonsspørsmål og posisjonalitetsøvelser.",
    "teaching_guide",
    null,
    "Durham University · OsloMet",
    2026,
    null,
  ),

  // ─── For municipalities: toolkits + practice guides + experiences ───
  resource(
    "res-toolkit-1",
    "Kulturbevisst omsorgsplan-mal",
    "Redigerbar mal for omsorgsplaner i hjemmet som fanger opp matpraksiser, bønnerytmer, transnasjonal støtte og språkpreferanser ut over avkrysningskategorier.",
    "toolkit",
    null,
    "Comte Bureau · safe@home",
    2026,
    null,
  ),
  resource(
    "res-toolkit-2",
    "Sjekkliste for tolkebevisst timeplanlegging",
    "En enkeltsides sjekkliste som hjelper omsorgskoordinatorer å sette av tolk samtidig med kvartalsvise omsorgsvurderinger — og dermed redusere mismatch og «signert-på-nikk»-vurderinger.",
    "toolkit",
    null,
    "safe@home-forskningsgruppen",
    2026,
    null,
  ),
  resource(
    "res-practice-1",
    "Praksisguide: utrulling av velferdsteknologi",
    "Praksisrettet guide for installasjon av bevegelsessensorer, medisindispensere og alarmer i flergenerasjonshusholdninger. Inkluderer spørsmål til samtykkesamtaler.",
    "practice_guide",
    null,
    "OsloMet · Comte Bureau",
    2026,
    null,
  ),
  resource(
    "res-exp-alna",
    "Alna: verdighetspilot på nattevakt",
    "Feltbeskrivelse fra Alna øst om det lille natt-vakt-teamet koblet med passive sensorer. Inkluderer hva som fungerte, hva som brøt sammen, og planleggingskompromissene som gjorde det mulig.",
    "experience",
    null,
    "Bydel Alna",
    2026,
    "Alna",
  ),
  resource(
    "res-exp-sn",
    "Søndre Nordstrand: lesesirkel på biblioteket",
    "Beretning om hvordan biblioteksirkelen på Holmlia ble et uformelt språk- og tilhørighetsrom. Beskriver hvordan bydelen stille støttet den uten å pakke den inn i en tjenestelinje.",
    "experience",
    null,
    "Bydel Søndre Nordstrand",
    2026,
    "Søndre Nordstrand",
  ),
];
