/**
 * English UI copy. Typed against the Norwegian dictionary, so a key added
 * there fails the build here until it is translated.
 */

import type { Dictionary } from "./no";

const en: Dictionary = {
  common: {
    loading: "Loading…",
    saving: "Saving…",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    back: "Back",
    retry: "Try again",
    previous: "Previous",
    next: "Next",
    add: "Add",
    remove: "Remove",
    search: "Search",
    searching: "Searching…",
    filter: "Filter",
    clearFilters: "Clear filters",
    showAll: "Show all",
    untitled: "(untitled)",
    unknown: "Unknown",
    skipToContent: "Skip to main content",
    languageLabel: "Language",
    ofTotal: "of",
    entryOne: "entry",
    entryOther: "entries",
    storyOne: "story",
    storyOther: "stories",
    connectionOne: "connection",
    connectionOther: "connections",
    tagOne: "tag",
    tagOther: "tags",
  },

  nav: {
    utility: "Research · OsloMet, UiO, Durham, Comte",
    mainMenu: "Main menu",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    closeShort: "Close",
    admin: "Admin",
    signIn: "Sign in",
    signInTeam: "Team sign-in →",
    signOut: "Sign out",
    newNote: "New note",
    sectionInternal: "Internal",
    sectionPublic: "Public pages",
    links: {
      about: { label: "About", description: "About the safe@home project and the research behind it." },
      admin: {
        label: "Editing",
        description: "Write and edit notes, insights, resources and more.",
      },
      content: {
        label: "Content",
        description: "Search, node map, frictions, qualities and resources.",
      },
      threads: { label: "Threads", description: "Arguments in progress — the analysis layer." },
      welfareTech: {
        label: "Existing initiatives",
        description: "Browse technology entries with full details.",
      },
    },
  },

  footer: {
    tagline:
      "A research platform on ageing, care and technology within the «Living safely at home» reform.",
    researchPartners: "Research partners",
    municipalPartners: "Municipal partners",
  },

  greeting: {
    welcome: "Hi {name}, welcome back to the Safe@Home platform",
  },

  people: {
    placeholder: "The project team will be presented here.",
    defaultRole: "Project team",
  },

  home: {
    metaTitle: "SAFE@HOME — Adapting municipal home care services for ageing immigrants",
    metaDescription:
      "A research project (2026–2029) adapting municipal home care services for older immigrants — led by OsloMet with UiO, Durham and Comte Bureau, in field collaboration with the Alna and Søndre Nordstrand districts of Oslo.",
    heroEyebrow: "Research project · 2026–2029",
    heroLead: "Adapting municipal home care services for ageing immigrants.",
    heroBody:
      "SAFE@HOME is a research project initiated by Marit Haldar and Carolina Borges Rau Steuernagel. It examines how Norway's «Living safely at home» reform meets everyday life in transnational households. We follow three scales — from bedroom to city council chamber — and map the frictions and qualities that arise when municipal care meets diverse later lives.",
    heroCta: "Read more about SAFE@HOME",
    heroIllustrationAlt: "SAFE@HOME illustration",

    aboutEyebrow: "About the project",
    aboutHeading: "Living safely at home — for whom, and on what terms?",
    aboutParagraphs: [
      "Norway's «Living safely at home» reform is designed to let more older people stay in their own homes for longer. It assumes that the home, the family and the local community can carry a greater share of the care work — and that municipal services meet people where they are.",
      "But the homes, families and everyday lives of older people with an immigrant background do not always follow the patterns those services were built around. SAFE@HOME examines what happens in that encounter, and how services can be adapted without losing direction or fairness.",
    ],
    factPeriod: "Period",
    factFieldSites: "Field sites",
    factFunding: "Funding",
    fundingBody:
      "The project is funded by the Research Council of Norway. You can read about the project here:",

    wpEyebrow: "Work packages",
    wpHeading: "Four tracks moving from the home to policy.",
    wpLead:
      "Each work package is led by one of the project partners, and the results come together on a shared platform for insights, challenges and service proposals.",
    wpLedBy: "Led by",
    workPackages: {
      wp1: "How material spaces and social dynamics in and around the home shape home-based care.",
      wp2: "The barriers and opportunities institutions create for access to home care services.",
      wp3: "How family ties and policy across national borders affect ageing at home.",
      wp4: "Co-creating practical solutions and services together with residents, staff and municipalities.",
    },

    partnersEyebrow: "Partners",
    partnersHeading: "An interdisciplinary consortium across research, design and local government.",
    partnerRoles: {
      lead: "Project lead",
      research: "Research partner",
      field: "Field collaboration",
      design: "Design partner",
    },
    partnerTitles: {
      pi: "Principal investigator (PI)",
      wp2Lead: "WP2 lead — Health & Care Institutions",
      wp3Lead: "WP3 lead — Transnational Contexts",
      wp4CoLead: "WP4 co-lead — Innovation & Service Design",
      wp4Platform: "WP4 co-lead — Platform & Service Design",
      platform: "Platform · WP4",
      wp1Lead: "WP1 lead — Homes & Communities",
      wp1Member: "WP1 — Homes & Communities",
      researcher: "Researcher",
      municipalPartner: "Municipal partner",
    },

    peopleEyebrow: "Project team",
    peopleHeading: "Researchers, designers and municipal partners.",
    peopleLead:
      "The project is run by a team spanning OsloMet, the University of Oslo, Durham University and Comte Bureau, in close collaboration with the Alna and Søndre Nordstrand districts.",

    contactEyebrow: "Contact",
    contactHeading: "Want to know more, or work with us?",
    contactLead: "Get in touch with the project leadership or the platform team.",

    footerBlurb:
      "A research project on ageing, care and belonging within the «Living safely at home» reform.",
    footerNavigate: "Navigate",
    footerConsortium: "Consortium",
    footerCopyright: "© 2026 The SAFE@HOME consortium",
    footerLinks: {
      about: "About the project",
      welfareTech: "Existing initiatives",
      municipalities: "For municipalities",
    },
  },

  about: {
    metaTitle: "About — safe@home",
    metaDescription: "About safe@home — the research project and the field sites.",
    eyebrow: "About the project",
    heading: "Older people, care and technology — research in Oslo.",
    paragraphs: [
      "safe@home is a collaborative project (2026–2029) between OsloMet, the University of Oslo, Durham University and Comte, working with the Alna and Søndre Nordstrand districts of Oslo.",
      "The project combines fieldwork, policy analysis and co-design to examine how home-based care services can be adapted for a growing group of older immigrants — a group whose routines, family forms and needs often do not fit standardised solutions.",
      "Among the questions we ask: what happens when welfare technology meets a transnational everyday life? How does the «Living safely at home» reform work across language, culture and generations? Which local strategies and improvisations keep people going where the services fall short?",
    ],
    pillarsEyebrow: "Three approaches",
    pillarsHeading: "Research that moves between the kitchen table and the council chamber.",
    pillars: {
      fieldwork: {
        tag: "Fieldwork",
        title: "Everyday life as a data source",
        body: "We spend time in homes, at meeting places and with service recipients — from Alna to Søndre Nordstrand — listening to how care is actually lived.",
      },
      policy: {
        tag: "Policy analysis",
        title: "The reform meets reality",
        body: "We trace how the «Living safely at home» reform is translated into municipal practice — and where it loses its grip on the transnational.",
      },
      codesign: {
        tag: "Co-design",
        title: "Tools that negotiate",
        body: "Together with residents, staff and municipal partners we build small, concrete service and technology moves that the research can test.",
      },
    },
    statusEyebrow: "Status",
    statusNote: "Results from the project will be published here as they become available.",
  },

  municipalities: {
    metaTitle: "For municipalities — safe@home",
    metaDescription:
      "Toolkits, practice guides and municipal experiences from the safe@home project.",
    eyebrow: "For municipalities",
    heading: "Tools and experience from the field.",
    lead: "Editable toolkits, practice guides and accessible accounts of what the partner municipalities are trying — what works, what broke down, and where the trade-offs lie. Written for home care coordinators, planners and service designers.",
    empty: "No tools or experiences have been published yet.",
  },

  auth: {
    unknownEmail:
      "We found no user with this address. Contact the project administrator for access.",
    badCode: "That code is wrong or has expired. Request a new one.",
    rateLimit: "You have requested too many codes. Wait a few minutes and try again.",
    generic: "Something went wrong. Try again shortly.",
    noProfile: "This account has no profile on the platform. Contact the project administrator.",
    missingEmail: "Enter your email address first.",
    shortCode: "The code is {n} digits.",
    wrongPassword: "Wrong email address or password.",
    samePassword: "The new password must differ from the previous one.",
    weakPassword: "That password is too weak. Choose a longer one.",
    recoveryExpired: "The recovery link has expired. Request a new one from the sign-in page.",
  },

  login: {
    metaTitle: "Sign in — safe@home",
    backToHome: "Back to the home page",
    eyebrow: "Sign-in for the project team",
    heading: "Sign in to publish insights.",
    intro:
      "Members of the SAFE@HOME research group sign in here to publish stories, design proposals and resources.",
    codeIntro:
      "We have sent a {n}-digit one-time code to {email}. The code is valid for a short while — check your spam folder if it does not turn up.",
    emailLabel: "Email",
    emailPlaceholder: "name@oslomet.no",
    passwordLabel: "Password",
    codeLabel: "One-time code",
    submitPassword: "Sign in",
    submitPasswordBusy: "Signing in…",
    submitEmail: "Send me a one-time code",
    submitEmailBusy: "Sending code…",
    submitCode: "Sign in",
    submitCodeBusy: "Signing in…",
    resend: "Send a new code",
    resendCooldown: "Send a new code ({s} s)",
    resendNotice: "New code sent. Use the most recent code in your inbox.",
    changeEmail: "Change email address",
    noCodeHelp:
      "No code arriving? The address has to be registered in advance — contact the project administrator if nothing comes.",
    forgotPassword: "Forgotten your password?",
    resetSent: "Check your email — we have sent a link for setting a new password.",
    switchToPassword: "Sign in with a password instead",
    switchToCode: "Sign in with a one-time code instead",
    accountsNote: "Accounts are managed by the research leads in Supabase.",
  },

  reset: {
    metaTitle: "Reset password — safe@home",
    eyebrow: "Reset password",
    heading: "Choose a new password.",
    intro: "Choose a password you will remember. You are signed in as soon as it is saved.",
    expired:
      "This link has expired or is missing a recovery session. Request a new reset link from the sign-in page.",
    newPassword: "New password",
    newPasswordPlaceholder: "At least 8 characters",
    confirmPassword: "Confirm password",
    tooShort: "The password must be at least 8 characters.",
    mismatch: "The passwords do not match.",
    saved: "Password updated. Taking you onwards…",
    submit: "Save new password",
    submitBusy: "Saving…",
    backToLogin: "Back to sign-in",
  },

  internal: {
    checkingSession: "Checking session…",
    metaTitle: "The analysis table — safe@home",
    metaDescription:
      "What is new since last time, entrances to the views, and the state of the material.",
    heading: "The SAFE@HOME analysis table",
    workInProgress: "Everything here is work in progress.",
    recentNotes: "Latest notes",
    noNotes: "No notes yet. The first one entered will show up here.",
    entrances: "Entrances",
    status: "Status",
    statNotes: "Quick notes",
    statInsights: "Insights",
    statResources: "Resources",
    statFootnote:
      "Data collection in Alna and Søndre Nordstrand starts in autumn 2026. These numbers grow with it.",
    entranceBlurbs: {
      search: "Notes, insights and resources in one place. Filter or search.",
      nodes: "Notes and insights connected by what they share.",
      frictions: "The seven mechanisms where care goes wrong.",
      qualities: "What makes care good when it lands.",
      threads: "Arguments in progress, with the notes that carry them.",
      admin: "Write and edit notes, insights and resources.",
    },
    entranceLabels: {
      search: "Search",
      nodes: "Node map",
      frictions: "Frictions",
      qualities: "Qualities",
      threads: "Threads",
      admin: "Editing",
    },
  },

  content: {
    metaTitle: "Content — safe@home",
    metaDescription:
      "All the material in the project: search, node map, frictions, qualities and resources.",
    eyebrow: "Internal",
    heading: "Content",
    lead: "All the material in the project, seen from four angles — one corpus, different entrances.",
    tabsLabel: "Content tabs",
    tabs: {
      search: "Search",
      nodes: "Node map",
      frictions: "Frictions",
      qualities: "Qualities",
    },
    tabCopy: {
      search: {
        title: "All the material",
        lead: "Notes, insights and resources in one place. Filter by type, friction or quality — or search.",
      },
      nodes: {
        title: "Node map",
        lead: "A force-directed graph of notes and insights, connected by shared categories.",
      },
      frictions: {
        title: "Seven ways the system collides with reality",
        lead: "Frictions name the recurring mechanisms where well-meant care harms all the same.",
      },
      qualities: {
        title: "Qualities",
        lead: "How people actually live and cope — what makes care good when it lands.",
      },
    },
  },

  browser: {
    loadError: "Could not load the material. Reload the page.",
    searchPlaceholder: "Search all the material…",
    typeLabel: "Type",
    frictionsLabel: "Frictions",
    qualitiesLabel: "Qualities",
    kinds: {
      quick_note: "Note",
      insight: "Insight",
      resource: "Resource",
    },
    noSearchHits: "No hits for this search.",
    noFilterHits: "Nothing matches these filters.",
    empty: "Nothing here yet. The first entry will show up here.",
    resourceSection: "The resource",
    openLink: "Open link ↗",
    download: "Download",
    pdfPreviewFallback: "Your browser cannot display the PDF here. Use the download link below.",
    noPreview: "This format cannot be previewed in the browser. Download the file to open it.",
    previewOf: "Preview of {name}",
    showInNodeMap: "Show in node map →",
  },

  frictions: {
    chordIntro:
      "This chord diagram shows how the frictions interweave across stories — the thicker the ribbon, the more lives share the same collision.",
    chordPending:
      "As the material grows, a chord diagram here will show how the frictions interweave across stories.",
    legend: "Legend",
    clearSelection: "Clear selection",
    allGrouped: "All stories grouped by friction",
    sharedBothOne: "story shares both",
    sharedBothOther: "stories share both",
    chordHint:
      "Hover a segment to highlight it. Click to lock. Click a ribbon to see the pair.",
    countsIntro:
      "The chord diagram is drawn once the material is rich enough to show how the frictions interweave. For now we show the counts exactly as they stand.",
    corpusEmpty:
      "The field material goes here. Data collection in Alna and Søndre Nordstrand starts in autumn 2026 — as notes are tagged with frictions, they appear here.",
    noCombination: "No stories share this combination yet.",
    pairTooltip: "{a} + {b} — {n} stories share both",
    singleTooltip: "{a} — {n} stories",
  },

  qualities: {
    corpusEmpty:
      "The field material goes here. Data collection in Alna and Søndre Nordstrand starts in autumn 2026 — as notes are tagged with qualities, they appear here.",
    noStories: "No stories yet.",
    descriptionPending: "A longer description is coming.",
    examples: "Examples",
    showDescription: "Show description for {label}",
    hideDescription: "Hide description for {label}",
    descriptionComingSoon: "{label} — description coming soon",
  },

  nodes: {
    loading: "Loading node graph…",
    loadError: "Could not load the material.",
    partial: "Some of the material could not be loaded ({sources}). The graph is incomplete.",
    empty:
      "No notes yet. Data collection starts in autumn 2026. Whatever is entered will appear here as nodes.",
    graphLabel: "Constellation graph of quick notes, insights and resources",
    title: "Node map",
    counts: "{visible} of {total} nodes · {edges} connections.",
    edgeLegendLabel: "Explanation of the edges",
    strongEdge: "Strong link — created manually",
    weakEdge: "Weak link — shared category",
    searchPlaceholder: "Search title or text…",
    types: {
      all: "All",
      notes: "Notes",
      insights: "Insights",
      resources: "Resources",
    },
    kinds: {
      quickNote: "Quick note",
      quickNoteShort: "Note",
      insight: "Insight",
      resource: "Resource",
    },
    noMatches: "No nodes match the filters.",
    filtersAndLegend: "Filters & legend",
    scaleLabel: "Scale",
    workPackageLabel: "Work package",
    hideSidebar: "Hide side panel",
    showSidebar: "Show side panel",
    legendNote:
      "Lines connect nodes that share a tag — the friction colour is used when the link runs via a friction, otherwise neutral grey.",
    manualEdge: "Manual link",
    manualEdgeTooltip: "Manual link (created in the note editor)",
    openResource: "Open resource →",
    noConnections: "No connections via shared categories",
  },

  threads: {
    metaTitle: "Threads — safe@home",
    metaDescription: "Arguments in progress: theses with the notes attached to them.",
    heading: "Threads",
    lead: "An argument in progress: a thesis, the notes that carry it, and why each of them belongs there. Everything here is work in progress.",
    loadError: "Could not load threads: {error}",
    empty:
      "No threads yet. A thread is an argument in progress — start one when you see a pattern recurring.",
    vetted: "✓ We stand by this",
    markVetted: "Mark as «We stand by this»",
    unmarkVetted: "Remove «We stand by this»",
    lastChanged: "Last changed {date}",
    newThread: "New thread",
    titlePlaceholder: "Working title, e.g. «Dispenser scripts recur across field sites»",
    summaryPlaceholder: "The argument as it stands (optional)",
    create: "Create",
    allThreads: "← All threads",
    statusLabel: "Status",
    argumentLabel: "The argument as it stands",
    unsaved: "Unsaved — click outside the field to save.",
    interpretationChanged: "Changed your reading? Log what you used to think.",
    addTurn: "Add a turn",
    notNow: "Not now",
    notesInThread: "Notes in this thread ({n})",
    noItems: "No notes added yet. Find them below.",
    missingSource: "(the source no longer exists)",
    itemNotePlaceholder: "Why does this belong here?",
    findNotes: "Find notes",
    searchCorpus: "Search the material",
    searchPlaceholder: "Search title and text…",
    previousInterpretations: "Previous interpretations",
    turnPlaceholder: "Until June we thought X; the field notes from Alna point rather to Y.",
    saveTurn: "Save turn",
    membershipHeading: "Threads",
    addToThread: "Add to a thread",
    loadingThreads: "Loading threads…",
    orNewThread: "…or a new thread",
    newThreadTitle: "Working title for the new thread",
    createAndAdd: "Create and add",
    sourceNoun: {
      quick_note: "This note",
      insight: "This insight",
      story: "This story",
      resource: "This resource",
    },
    notInAnyThread: "{noun} is not part of any thread yet.",
  },

  welfareTech: {
    metaTitle: "Existing initiatives · SAFE@HOME",
    metaDescription:
      "A curated overview of welfare technology relevant to home-based care for older people with an immigrant background — as inspiration and reference.",
    eyebrow: "Internal",
    heading: "Existing initiatives",
    lead: "A curated overview of welfare technology relevant to home-based care for older people with an immigrant background. The selection was made by the SAFE@HOME project as inspiration and reference — not as a recommendation.",
    editLink: "+ Add / edit entries",
    filterLabel: "Filter by category",
    emptyCategory: "No entries in this category yet.",
    noImage: "no image",
    uncategorised: "Uncategorised",
    learnMore: "Learn more →",
    curatorNote: "Curator's note:",
  },

  solutions: {
    metaTitle: "Design responses — safe@home",
    metaDescription:
      "Design responses take shape in WP4 when field material from WP1–3 points to challenges worth working on.",
    eyebrow: "Design responses",
    heading: "From observation to intervention.",
    lead1:
      "Design responses take shape in WP4 when field material from WP1–3 points to challenges worth working on.",
    lead2:
      "When the research uncovers a friction, the design team answers. These are the interventions being developed, tested and refined — from field observation to practical solution.",
    pipeline: "Pipeline",
    responseOne: "response",
    responseOther: "responses",
    clearStageFilter: "Clear stage filter",
    allResponses: "All responses",
    stageResponses: "{stage} — responses",
    emptyStage: "No responses at this stage yet.",
    addresses: "Addresses",
    basedOn: "Based on",
    progressEyebrow: "Progress",
    progressHeading: "Monthly reports from the work packages.",
    progressLead:
      "Monthly interviews with each work package, carried out by Comte, summarising where the research stands.",
    monthLabel: "Month",
    allMonths: "All months",
    showAllMonths: "Show all months",
    noReportsYet: "The first monthly reports are being written now. Check back soon.",
    noReportsForMonth: "No reports for {month}.",
    noPublishedReports: "No published reports yet.",
    hideEarlier: "Hide earlier months",
    earlierMonths: "Earlier months · {n}",
    nextSteps: "Next steps:",
    interviewWith: "with",
  },

  story: {
    notFound: "Story not found — safe@home",
    backToFrictions: "← Back to frictions",
    designResponseEyebrow: "Design response",
    designResponseHeading: "How the design team answers",
    connectedStories: "Connected stories",
    noConnected: "No connected stories yet.",
    showFewer: "Show fewer",
    showAllN: "Show all {n}",
  },

  readingRoom: {
    frictionsLabel: "Frictions",
    qualitiesLabel: "Qualities",
    clearWithCount: "Clear filters ({n})",
    noMatches: "No resources match these filters.",
    empty:
      "No publications yet. The first working papers and policy texts will be posted as they are written.",
  },

  resources: {
    linkedInsights: "Linked insights · {n}",
    open: "Open →",
    download: "Download →",
    comingSoon: "Coming soon",
  },
};

export default en;
