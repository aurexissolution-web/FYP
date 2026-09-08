// Real evaluation numbers, copied verbatim from the training run outputs.
// Sources: ml-service/models/text_bigru_metrics.json and audio_cnn_metrics.json.
// Do not round or restate these differently elsewhere — the Research page and
// any stat callouts across the site should all read from here.

export type ClassMetric = {
  precision: number;
  recall: number;
  f1: number;
  support: number;
};

export const TEXT_MODEL = {
  name: "Bi-GRU",
  dataset: "GoEmotions (mapped to 4 classes)",
  accuracy: 0.6656,
  macroF1: 0.6108,
  weightedF1: 0.6713,
  testSamples: 4567,
  perClass: {
    happy: { precision: 0.8202, recall: 0.7441, f1: 0.7803, support: 1895 },
    sad: { precision: 0.4159, recall: 0.6266, f1: 0.5, support: 308 },
    angry: { precision: 0.5053, recall: 0.5354, f1: 0.5199, support: 706 },
    neutral: { precision: 0.6473, recall: 0.6387, f1: 0.643, support: 1658 },
  } satisfies Record<EmotionClass, ClassMetric>,
} as const;

export const AUDIO_MODEL = {
  name: "CNN",
  dataset: "RAVDESS",
  validation: "6-fold, actor-disjoint cross-validation",
  meanAccuracy: 0.6146,
  stdAccuracy: 0.053,
  meanMacroF1: 0.5688,
  stdMacroF1: 0.0765,
  foldAccuracies: [0.5347, 0.7014, 0.6111, 0.6111, 0.6528, 0.5764],
  deployedValAccuracy: 0.5625,
  // Order matches labels below: happy, sad, angry, neutral.
  aggregatedConfusion: [
    [96, 40, 24, 32],
    [20, 65, 9, 98],
    [58, 13, 114, 7],
    [8, 24, 0, 256],
  ],
  perClassF1: { happy: 0.51, sad: 0.39, angry: 0.67, neutral: 0.75 } as Record<
    EmotionClass,
    number
  >,
} as const;

export type EmotionClass = "happy" | "sad" | "angry" | "neutral";
export const EMOTION_CLASSES: EmotionClass[] = [
  "happy",
  "sad",
  "angry",
  "neutral",
];

// Fusion weight per class, derived the same way ml-service/app/main.py does:
// w_text(c) = F1_text(c) / (F1_text(c) + F1_audio(c))
export const FUSION_WEIGHTS: Record<EmotionClass, { text: number; audio: number }> =
  Object.fromEntries(
    EMOTION_CLASSES.map((c) => {
      const t = TEXT_MODEL.perClass[c].f1;
      const a = AUDIO_MODEL.perClassF1[c];
      const wText = t / (t + a);
      return [c, { text: wText, audio: 1 - wText }];
    }),
  ) as Record<EmotionClass, { text: number; audio: number }>;
