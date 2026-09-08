export type Emotion = "happy" | "sad" | "angry" | "neutral";
export type Language = "en" | "ms";
export type MessageRole = "user" | "ai";
export type MessageType = "text" | "voice" | "mood" | "plan" | "crisis";
export type Source = "text" | "voice" | "both";

export type ModalityResult = {
  label: Emotion;
  confidence: number;
  probs?: Record<Emotion, number> | null;
};

export type SelfCareItem = { day: number; activity: string };

export type HotlineEntry = { name: string; phone: string; description: string };

export type AnalyzeResponse = {
  text_result: ModalityResult | null;
  audio_result: ModalityResult | null;
  fusion_result: ModalityResult;
  crisis: boolean;
  response_message: string;
  self_care_plan: SelfCareItem[];
  hotlines: HotlineEntry[];
};

export type ChatReplyResponse = { reply: string; crisis: boolean };

export type SessionRow = {
  id: string;
  title: string | null;
  created_at: string;
  source: Source;
  fusion_result: Emotion;
  crisis_triggered: boolean;
};

export type ChatMessageRow = {
  id: string;
  session_id: string;
  role: MessageRole;
  type: MessageType;
  content: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
