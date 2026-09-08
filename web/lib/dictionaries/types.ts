// The shared shape both en.ts and ms.ts must satisfy. Keeping this as a
// TypeScript type (not JSON) means a missing or misspelled key in either
// dictionary is a compile error, not a silent blank on a live page.

export type Stat = { value: string; label: string; detail: string };
export type DemoCallout = { title: string; detail: string };
export type FeatureItem = { title: string; body: string };
export type Step = { title: string; body: string };

export type Dictionary = {
  nav: {
    home: string;
    features: string;
    howItWorks: string;
    research: string;
    about: string;
    help: string;
    signIn: string;
    signUp: string;
    openMenu: string;
  };
  footer: {
    tagline: string;
    product: string;
    company: string;
    privacy: string;
    getHelp: string;
    contact: string;
    disclaimer: string;
    rights: string;
  };
  home: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustLine: string;
    pills: [string, string, string];
    flow: [string, string, string];
    phone: {
      userMsg: string;
      aiMsg: string;
      planTitle: string;
      planDays: [string, string, string];
      inputPlaceholder: string;
    };
    statsEyebrow: string;
    statsHeading: string;
    stats: [Stat, Stat, Stat];
    // Labels for the four-fact strip under the medallions; the values come
    // from lib/metrics.ts at render time.
    proofStrip: [string, string, string];
    statsLink: string;
    // "How it works" on the home page reuses howItWorks.eyebrow/heading/steps.
    stepsLink: string;
    stepsOverrideChip: string;
    // Auto-playing demo. The replay's own text lives in lib/demo-script.ts
    // (it alternates languages regardless of page locale); these are the
    // page-locale labels around it.
    demo: {
      eyebrow: string;
      heading: string;
      body: string;
      callouts: [DemoCallout, DemoCallout, DemoCallout, DemoCallout, DemoCallout];
      replayNote: string;
    };
    // "Under the hood": the pipeline diagram labels and the fusion-weight bars.
    hood: {
      eyebrow: string;
      heading: string;
      body: string;
      nodes: {
        text: string;
        voice: string;
        crisis: string;
        crisisSub: string;
        hotlines: string;
        textModel: string;
        audioModel: string;
        fusion: string;
        fusionSub: string;
        emotion: string;
        output: string;
      };
      weightsHeading: string;
      textLabel: string;
      audioLabel: string;
      // Display names for happy / sad / angry / neutral, in that order.
      classes: [string, string, string, string];
      link: string;
    };
    problemEyebrow: string;
    problemHeading: string;
    problemBody: string;
    // The headline figure (1,000,000 — a number, so it lives in the page) and
    // its label + source; then two supporting figures whose `value` is
    // per-language ("1 in 4" / "1 dari 4") and whose `detail` names the survey.
    problemBig: { label: string; source: string };
    problemStats: [Stat, Stat];
    problemBarriersHeading: string;
    problemBarriers: [FeatureItem, FeatureItem, FeatureItem];
    problemBridge: { eyebrow: string; heading: string; body: string };
    featuresEyebrow: string;
    // The headline is rendered as `featuresHeading` + `featuresHeadingAccent`,
    // with the accent phrase in the brand colour. Write both languages so the
    // accent is the final phrase of the sentence.
    featuresHeading: string;
    featuresHeadingAccent: string;
    featuresBody: string;
    featuresLink: string;
    // Exactly five: the home page pairs these positionally with five icons,
    // and the tuple length is what keeps copy and icons from drifting apart.
    features: [FeatureItem, FeatureItem, FeatureItem, FeatureItem, FeatureItem];
    // Feature bento micro-visuals (illustrative UI text, not product claims).
    bento: {
      sampleEn: string;
      sampleMs: string;
      onlyYou: string;
      historyRows: [string, string, string];
    };
    safetyEyebrow: string;
    safetyHeading: string;
    safetyBody: string;
    safetyDoesHeading: string;
    safetyDoesNotHeading: string;
    hotlineCall: string;
    safetyLink: string;
    aboutEyebrow: string;
    aboutHeading: string;
    aboutLink: string;
    aboutBuildEyebrow: string;
    aboutBuildBadge: string;
    aboutBuild: [string, string, string, string];
    sdgLabel: string;
    faq: {
      eyebrow: string;
      heading: string;
      body: string;
      facts: [{ value: string; label: string }, { value: string; label: string }, { value: string; label: string }];
      items: { q: string; a: string }[];
    };
    finalCtaHeading: string;
    finalCtaBody: string;
    finalCtaButton: string;
  };
  features: {
    eyebrow: string;
    heading: string;
    subheading: string;
    items: FeatureItem[];
  };
  howItWorks: {
    eyebrow: string;
    heading: string;
    subheading: string;
    steps: Step[];
    crisisNote: string;
    techNote: string;
  };
  research: {
    eyebrow: string;
    heading: string;
    subheading: string;
    taskHeading: string;
    taskBody: string;
    textHeading: string;
    textBody: string;
    audioHeading: string;
    audioBody: string;
    audioValidationNote: string;
    fusionHeading: string;
    fusionBody: string;
    fusionFormula: string;
    fusionInsightHeading: string;
    fusionInsightBody: string;
    limitationsHeading: string;
    limitations: string[];
    reproHeading: string;
    reproBody: string;
    tableClass: string;
    tablePrecision: string;
    tableRecall: string;
    tableF1: string;
    tableSupport: string;
  };
  about: {
    eyebrow: string;
    heading: string;
    story: string;
    institutionHeading: string;
    institutionBody: string;
    sdgHeading: string;
    sdgBody: string;
    sdg3: string;
    sdg10: string;
  };
  privacy: {
    eyebrow: string;
    heading: string;
    subheading: string;
    storedHeading: string;
    stored: string[];
    notStoredHeading: string;
    notStored: string[];
    accessHeading: string;
    accessBody: string;
    thirdPartyHeading: string;
    thirdPartyBody: string;
    deletionHeading: string;
    deletionBody: string;
    disclaimerHeading: string;
    disclaimerBody: string;
  };
  help: {
    eyebrow: string;
    heading: string;
    subheading: string;
    emergencyBanner: string;
    hotlinesHeading: string;
    expectHeading: string;
    expectBody: string;
    emoBuddyDoesHeading: string;
    emoBuddyDoes: string[];
    emoBuddyDoesNotHeading: string;
    emoBuddyDoesNot: string[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    body: string;
    emailLabel: string;
    githubLabel: string;
    institutionLabel: string;
  };
};
