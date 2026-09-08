/*
  Script for the auto-playing demo on the home page. It deliberately carries
  BOTH languages, because the demo alternates between them to show that
  Bahasa Melayu is a first-class language — regardless of which locale the
  page is being viewed in.

  The messages and plan are the same illustrative check-in used in the hero
  mock-up (home.phone in en.ts / ms.ts). The detected emotion is one of the
  four real classes the models predict; no confidence figure is shown because
  a made-up number would masquerade as a measurement.
*/
export type DemoLang = "en" | "ms";

export type DemoScript = {
  chip: string;
  userMsg: string;
  aiMsg: string;
  crisisPassed: string;
  detected: string;
  emotion: string;
  planTitle: string;
  planDays: [string, string, string];
  placeholder: string;
};

export const DEMO_SCRIPT: Record<DemoLang, DemoScript> = {
  en: {
    chip: "EN",
    userMsg: "I've been feeling really anxious about my exams.",
    aiMsg: "That sounds like a lot to carry. Let's take it one step at a time.",
    crisisPassed: "Crisis check · passed",
    detected: "Detected",
    emotion: "Sad",
    planTitle: "Your 3-Day Self-Care Plan",
    planDays: [
      "Day 1 — 5-minute breathing exercise",
      "Day 2 — Write down one proud moment",
      "Day 3 — Reach out to someone you trust",
    ],
    placeholder: "Type or hold to speak…",
  },
  ms: {
    chip: "BM",
    userMsg: "Saya rasa sangat cemas tentang peperiksaan saya.",
    aiMsg: "Bunyinya seperti bebanan yang berat. Mari kita hadapinya langkah demi langkah.",
    crisisPassed: "Semakan krisis · lulus",
    detected: "Dikesan",
    emotion: "Sedih",
    planTitle: "Pelan Jagaan Diri 3 Hari Anda",
    planDays: [
      "Hari 1 — Senaman pernafasan 5 minit",
      "Hari 2 — Tulis satu perkara yang anda banggakan",
      "Hari 3 — Hubungi seseorang yang anda percayai",
    ],
    placeholder: "Taip atau tekan untuk bercakap…",
  },
};
