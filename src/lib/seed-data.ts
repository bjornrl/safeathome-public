import type { PublicStory, PublicConnection, CareFriction, CareQuality, MapScale, HouseTheme } from "./types";

function story(
  id: string, title: string, body: string, theme: HouseTheme | null,
  field_site: string, frictions: CareFriction[], qualities: CareQuality[],
  map_scale: MapScale, latitude: number | null, longitude: number | null,
): PublicStory {
  return {
    id, title, body, theme, frictions, qualities, map_scale, latitude, longitude,
    home_based: theme !== null,
    field_site: field_site as PublicStory["field_site"],
    source_insight_id: null, media_urls: [], author_credit: "safe@home fieldwork team",
    published: true, published_at: "2025-01-01", sort_order: 0,
    created_by: "seed", created_at: "2025-01-01", updated_at: "2025-01-01",
  };
}

function conn(
  id: string, from: string, to: string, friction: CareFriction,
  type: "direct" | "indirect", desc: string,
): PublicConnection {
  return {
    id, from_story_id: from, to_story_id: to, friction,
    category_kind: "friction", category_key: friction,
    connection_type: type, description: desc,
    published: true, created_at: "2025-01-01",
  };
}

export const SEED_STORIES: PublicStory[] = [
  // ════════════════════════════════════════
  // MICRO — Inside the home (all at ~59.8976, 10.8155)
  // ════════════════════════════════════════
  story("seed-micro-1", "The dispenser and the prayer rug",
    "The automated medicine dispenser was placed in the living room. But this room also serves as the family's prayer area. Five times a day, the dispenser gets moved.\n\nHassan's son began moving it to the kitchen during prayer times, then forgetting to move it back. Doses were missed. The system flagged non-adherence.",
    "living_room", "Søndre Nordstrand", ["script", "invisible"], ["household_choreography", "cultural_anchoring"], "micro", 59.8976, 10.8155),

  story("seed-micro-2", "When the alarm doesn't understand family",
    "Amira is 78 and lives alone — most of the year. When her daughter visits from Nairobi, the bedroom's motion sensor triggers every night.\n\nAfter the third false alarm, Amira started turning the sensor off. The care coordinator noted this as 'non-compliance.'",
    "bedroom", "Alna", ["script", "displace"], ["transnational_flow", "household_choreography"], "micro", 59.8976, 10.8155),

  story("seed-micro-3", "A coffee table of care",
    "On Fatima's coffee table: a tablet for video calls to Mogadishu, a pill organizer labeled in Somali, a Norwegian-Somali dictionary. This surface is a map of her care network — spanning continents, languages, and generations.\n\nThe homecare assessment noted 'limited social network.'",
    "living_room", "Alna", ["reduce", "invisible"], ["digital_bridging"], "micro", 59.8976, 10.8155),

  story("seed-micro-4", "The invisible care coordinator",
    "Every evening at 7pm, Rashida's daughter calls from Lahore. She asks about medication, reminds her mother about tomorrow's GP appointment, and troubleshoots the tablet.\n\nThis daily phone call is a care intervention. But it appears nowhere in Rashida's care plan.",
    "phone", "Søndre Nordstrand", ["invisible", "exclude"], ["transnational_flow", "digital_bridging"], "micro", 59.8976, 10.8155),

  story("seed-micro-5", "The bathroom door that locks from outside",
    "The safety lock on Khalid's bathroom was installed to prevent him from falling and being trapped inside. But to Khalid, a man who spent two years in a detention centre before coming to Norway, a door that locks from the outside is not safety. It is captivity.\n\nHe asked the homecare workers to remove it. They referred him to the occupational therapist. The OT noted 'fall risk — lock must remain.'",
    "bathroom", "Alna", ["displace", "script"], ["adaptive_resistance"], "micro", 59.8976, 10.8155),

  story("seed-micro-6", "The kitchen radio tuned to Addis",
    "Selam's kitchen radio is always tuned to an Ethiopian station streaming via her phone. The familiar voices, the music, the Amharic news — they fill the apartment with a world the homecare workers don't see.\n\nWhen a new worker asked her to turn it off so they could 'focus on the morning routine,' Selam felt a small part of home disappear.",
    "kitchen", "Alna", ["displace", "reduce"], ["cultural_anchoring", "belonging_negotiation"], "micro", 59.8976, 10.8155),

  story("seed-micro-7", "Grandchildren as IT support",
    "Every Saturday, Yusra's 11-year-old granddaughter comes over and fixes whatever has gone wrong with the tablet, the TV remote, and the digital pill dispenser. She resets passwords, updates apps, and explains new interfaces in a mix of Norwegian and Somali.\n\nThis child is the de facto tech support for a welfare technology system designed by adults who assumed users would call a helpline.",
    "phone", "Alna", ["script", "invisible"], ["intergenerational_exchange", "digital_bridging"], "micro", 59.8976, 10.8155),

  story("seed-micro-8", "The study full of letters",
    "In Abdi's study, a drawer overflows with unopened envelopes from NAV, the municipality, and the hospital. Each letter assumes fluent Norwegian, digital literacy, and familiarity with bureaucratic language.\n\nAbdi's daughter visits every other weekend to sort through them. Between visits, deadlines pass. Appeals expire. Rights go unexercised.",
    "study", "Søndre Nordstrand", ["exclude", "reduce"], ["transnational_flow", "invisible_labor"], "micro", 59.8976, 10.8155),

  // ════════════════════════════════════════
  // MESO — Neighborhood (spread around Alna)
  // ════════════════════════════════════════
  story("seed-meso-1", "Twelve faces in three months",
    "Mariam kept a handwritten list by her front door — the names of every homecare worker who had visited since January. By March, there were twelve.\n\n'I have stopped learning their names,' she told her son.",
    "front_door", "Alna", ["rotate", "isolate"], ["adaptive_resistance"], "meso", 59.8970, 10.8140),

  story("seed-meso-2", "The Thursday bench",
    "Every Thursday at 2pm, four women meet on the same bench outside the community center. They share food wrapped in foil. They watch each other's grandchildren.\n\nWhen the bench was removed during a park renovation, the women stopped coming outside for three weeks.",
    "garden", "Alna", ["invisible"], ["cultural_anchoring", "invisible_labor"], "meso", 59.8985, 10.8170),

  story("seed-meso-3", "When 'halal' isn't enough",
    "Mohammed's care plan says 'halal diet.' His rotating homecare staff interpret this differently each week.\n\nWhat Mohammed actually needs is not just halal — it's familiar. 'Halal' is a dietary law. It is not a cuisine.",
    "kitchen", "Alna", ["reduce", "rotate"], ["cultural_anchoring", "adaptive_resistance"], "meso", 59.8965, 10.8160),

  story("seed-meso-4", "The GP who never has time",
    "Dr. Andersen sees 30 patients a day. When Yusuf arrives with his daughter translating, 15 minutes become 7 minutes of actual medical discussion.\n\nYusuf's complex needs are compressed into a checkbox on a screen.",
    "front_door", "Alna", ["reduce", "exclude"], ["belonging_negotiation"], "meso", 59.8960, 10.8120),

  story("seed-meso-5", "The pharmacy that became a classroom",
    "The pharmacist at Alna Senter noticed that several elderly customers couldn't read their medication labels. She started offering informal 'medicine school' sessions every Tuesday morning — explaining dosages, side effects, and interactions in plain language, sometimes with a Somali interpreter.\n\nThe municipality didn't fund it. The pharmacy chain didn't know about it. It just happened because someone noticed a gap.",
    "front_door", "Alna", ["invisible", "exclude"], ["adaptive_resistance", "invisible_labor"], "meso", 59.8950, 10.8100),

  story("seed-meso-6", "The mosque as waiting room",
    "When Hamza's homecare visit is delayed — which happens often — he walks to the mosque three blocks away. He prays, drinks tea, and waits. The imam knows his medication schedule better than most of the rotating homecare staff.\n\nThe mosque functions as an informal care hub. But it is invisible to the system that plans Hamza's services.",
    "prayer_space", "Alna", ["invisible", "rotate"], ["cultural_anchoring", "invisible_labor"], "meso", 59.8990, 10.8190),

  story("seed-meso-7", "The interpreter who wasn't there",
    "Fatima's quarterly care review was scheduled for a Tuesday. The interpreter was booked for Wednesday. No one caught the mismatch until Fatima arrived and found herself alone with three professionals speaking rapid Norwegian.\n\nShe nodded through the meeting. Her care plan was updated based on her nods. She told her daughter afterward: 'I don't know what I agreed to.'",
    "front_door", "Alna", ["exclude", "reduce"], ["adaptive_resistance", "belonging_negotiation"], "meso", 59.8940, 10.8180),

  story("seed-meso-8", "The night shift gap",
    "Between 22:00 and 06:00, there is no homecare coverage in Alna east. For Miriam, who needs help getting to the bathroom at night, this means wearing adult diapers she finds humiliating.\n\nHer daughter tried to arrange private night care but couldn't afford it. The municipality said the need 'didn't meet the threshold for night services.'",
    "bedroom", "Alna", ["isolate", "displace"], ["invisible_labor", "adaptive_resistance"], "meso", 59.8955, 10.8200),

  story("seed-meso-9", "The community garden plot",
    "Ibrahim's allotment garden in Alna is where he grows tomatoes, mint, and chili peppers — varieties you can't find at Kiwi. It is also where he meets other men his age, shares seeds, and speaks Tigrinya without apology.\n\nWhen his mobility declined, no one from homecare offered to help him get there. The garden visits stopped. Then the cooking stopped. Then the appetite stopped.",
    "garden", "Alna", ["isolate", "invisible"], ["cultural_anchoring", "belonging_negotiation"], "meso", 59.8975, 10.8210),

  // ════════════════════════════════════════
  // MESO — Søndre Nordstrand
  // ════════════════════════════════════════
  story("seed-meso-10", "The Holmlia library circle",
    "Every Wednesday, a group of elderly women gather in the Holmlia library to read Norwegian children's books aloud — practicing the language they were never formally taught. The librarian provides books and patience.\n\nSeveral participants say this hour is the only time all week they speak Norwegian with someone who isn't a care worker in a hurry.",
    "study", "Søndre Nordstrand", ["exclude", "invisible"], ["adaptive_resistance", "belonging_negotiation"], "meso", 59.8355, 10.7940),

  story("seed-meso-11", "The Mortensrud health station queue",
    "The health station at Mortensrud serves a diverse population but has only Norwegian-language intake forms. The queue moves slowly because each patient needs extra time — not for treatment, but for translation.\n\nA volunteer interpreter comes on Thursdays. On other days, people bring children to translate their medical complaints.",
    "front_door", "Søndre Nordstrand", ["exclude", "reduce"], ["intergenerational_exchange"], "meso", 59.8320, 10.7900),

  // ════════════════════════════════════════
  // MACRO — City / systemic level
  // ════════════════════════════════════════
  story("seed-macro-1", "Bus route 37 cancelled",
    "When bus route 37 was discontinued, it was a budget decision. The route connected Alna to the nearest hospital with interpreting services.\n\nA transport decision became a healthcare gap. A budget line became isolation.",
    "front_door", "Alna", ["isolate", "exclude"], ["belonging_negotiation"], "macro", 59.9100, 10.7700),

  story("seed-macro-2", "Bo Trygt Hjemme reform deploys new tech",
    "The reform promises technology that will let elderly people stay in their homes longer. Sensors, alarms, digital medication dispensers.\n\nBut its assumptions are built on a specific household: one person, living alone, with predictable routines.",
    "hallway", "Alna", ["script"], [], "macro", 59.9139, 10.7522),

  story("seed-macro-3", "The digital-first policy",
    "Oslo municipality moved most service applications online. Citizens who need homecare, assistive devices, or transport support must now apply through a digital portal — in Norwegian.\n\nFor elderly immigrants who are pre-digital and pre-literate in Norwegian, this is not simplification. It is a new wall.",
    "study", "Alna", ["exclude", "script"], ["digital_bridging"], "macro", 59.9200, 10.7400),

  story("seed-macro-4", "Municipal budget cuts to interpreter services",
    "In 2024, Oslo reduced funding for in-person interpreter services by 30%, directing resources toward phone and video interpretation instead.\n\nFor elderly patients who struggle with phone audio quality and can't navigate video apps, this saving produces a different cost: misdiagnosis, missed nuance, and medical decisions made on partial understanding.",
    "front_door", "Alna", ["exclude", "reduce"], ["digital_bridging", "belonging_negotiation"], "macro", 59.9170, 10.7600),

  story("seed-macro-5", "The care needs assessment algorithm",
    "The municipality introduced a standardized algorithm to determine homecare hours. It scores physical mobility, cognitive function, and daily living activities. It does not score loneliness, cultural isolation, or the complexity of managing care across languages.\n\nClients who score 'low need' on the algorithm may have enormous unmet needs the algorithm was not designed to see.",
    "study", "Alna", ["reduce", "script"], ["invisible_labor"], "macro", 59.9050, 10.7800),

];

export const SEED_CONNECTIONS: PublicConnection[] = [
  // ─── Macro → Meso cascades ───
  conn("seed-conn-1", "seed-macro-1", "seed-meso-4", "isolate", "direct",
    "Bus cancellation makes GP appointments unreachable"),
  conn("seed-conn-2", "seed-macro-2", "seed-micro-2", "script", "indirect",
    "Reform tech doesn't account for transnational family patterns"),
  conn("seed-conn-3", "seed-macro-2", "seed-micro-1", "script", "indirect",
    "Standardized tech disrupts household prayer rhythms"),
  conn("seed-conn-4", "seed-macro-3", "seed-micro-8", "exclude", "direct",
    "Digital-first policy creates a pile of unopened letters"),
  conn("seed-conn-5", "seed-macro-4", "seed-meso-7", "exclude", "direct",
    "Interpreter budget cuts cause scheduling mismatches"),
  conn("seed-conn-6", "seed-macro-5", "seed-micro-4", "reduce", "indirect",
    "Algorithm can't see transnational care networks"),

  // ─── Meso → Micro cascades ───
  conn("seed-conn-8", "seed-meso-1", "seed-micro-2", "rotate", "direct",
    "Staff rotation undermines trust needed for intimate home care"),
  conn("seed-conn-9", "seed-meso-3", "seed-micro-1", "reduce", "direct",
    "Cultural food complexity reduced to a checkbox in the care plan"),
  conn("seed-conn-10", "seed-meso-3", "seed-micro-6", "reduce", "direct",
    "Dietary reductionism echoes in the kitchen radio being silenced"),
  conn("seed-conn-11", "seed-meso-8", "seed-micro-5", "isolate", "direct",
    "Night shift gap forces undignified workarounds at home"),
  conn("seed-conn-12", "seed-meso-5", "seed-micro-3", "invisible", "indirect",
    "Pharmacy's informal care mirrors the invisible coffee table network"),
  conn("seed-conn-13", "seed-meso-9", "seed-micro-6", "isolate", "direct",
    "When the garden stops, the kitchen falls silent"),
  conn("seed-conn-14", "seed-meso-6", "seed-micro-7", "invisible", "indirect",
    "Mosque's informal care parallels grandchild IT support"),

  // ─── Cross-scale chains ───
  conn("seed-conn-15", "seed-macro-1", "seed-meso-9", "isolate", "direct",
    "Transport cuts sever access to community gardens"),
  conn("seed-conn-16", "seed-macro-4", "seed-meso-11", "exclude", "direct",
    "Interpreter cuts ripple to health station queues"),
  conn("seed-conn-17", "seed-macro-3", "seed-meso-10", "exclude", "indirect",
    "Digital-first policies make the library circle more essential"),

  // ─── Meso ↔ Meso lateral connections ───
  conn("seed-conn-18", "seed-meso-1", "seed-meso-6", "rotate", "direct",
    "Staff turnover pushes people toward informal care at the mosque"),
  conn("seed-conn-19", "seed-meso-7", "seed-meso-11", "exclude", "direct",
    "Interpreter gaps are systemic, from care reviews to health stations"),
  conn("seed-conn-20", "seed-meso-2", "seed-meso-9", "invisible", "indirect",
    "Informal community spaces share the same fragility"),
];
