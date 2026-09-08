import type { Emotion } from "./chat/types";

// Mirrors app/lib/utils/mood_visuals.dart's emoji choice exactly, mapped
// onto this site's own color tokens instead of Flutter's raw hex values.
export const MOOD_EMOJI: Record<Emotion, string> = {
  happy: "😊",
  sad: "😔",
  angry: "😠",
  neutral: "😐",
};

export const MOOD_TINT: Record<Emotion, { bg: string; text: string }> = {
  happy: { bg: "bg-sage-tint", text: "text-sage-deep" },
  sad: { bg: "bg-indigo-tint", text: "text-blue" },
  angry: { bg: "bg-coral-tint", text: "text-coral-deep" },
  neutral: { bg: "bg-cream-alt", text: "text-ink-faint" },
};
