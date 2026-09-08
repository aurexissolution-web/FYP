import { createClient } from "@/lib/supabase/server";
import type {
  AnalyzeResponse,
  ChatMessageRow,
  Language,
  MessageRole,
  MessageType,
  MoodLogWithPlans,
  SessionRow,
  Source,
} from "./types";

/**
 * Server-side mirror of app/lib/services/session_service.dart.
 * Both clients write the same rows, so a session started on the web opens in
 * the Flutter app and vice versa. Changes here need a matching change there.
 *
 * No `server-only` import guard: that package is not a dependency, and the
 * secret it would protect (ML_SERVICE_URL) is already unreachable from the
 * browser because it carries no NEXT_PUBLIC_ prefix. Only route handlers and
 * server components import this module.
 */

export async function createSession(userId: string, title: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_logs")
    .insert({
      user_id: userId,
      title: title.slice(0, 80),
      source: "text",
      fusion_result: "neutral",
      confidence: 0.0,
      crisis_triggered: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(`createSession failed: ${error.message}`);
  return data.id as string;
}

export async function addMessage(
  userId: string,
  args: {
    sessionId: string;
    role: MessageRole;
    type: MessageType;
    content?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    session_id: args.sessionId,
    user_id: userId,
    role: args.role,
    type: args.type,
    content: args.content ?? null,
    metadata: args.metadata ?? {},
  });
  if (error) throw new Error(`addMessage failed: ${error.message}`);
}

/** The user's own messages for a session, oldest first — what ml-service wants. */
export async function getUserMessages(userId: string, sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("content")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getUserMessages failed: ${error.message}`);
  return (data ?? [])
    .map((row) => row.content as string | null)
    .filter((c): c is string => Boolean(c));
}

export async function saveAnalysis(
  userId: string,
  args: {
    sessionId: string;
    result: AnalyzeResponse;
    source: Source;
    language: Language;
    conversationText?: string;
  },
) {
  const supabase = await createClient();
  const { result, sessionId } = args;

  const { error: updateError } = await supabase
    .from("mood_logs")
    .update({
      source: args.source,
      text_result: result.text_result?.label ?? null,
      audio_result: result.audio_result?.label ?? null,
      fusion_result: result.fusion_result.label,
      confidence: result.fusion_result.confidence,
      crisis_triggered: result.crisis,
      conversation_text: args.conversationText ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) throw new Error(`saveAnalysis update failed: ${updateError.message}`);

  await addMessage(userId, {
    sessionId,
    role: "ai",
    type: result.crisis ? "crisis" : "mood",
    content: result.response_message,
    metadata: { result },
  });

  if (!result.crisis && result.self_care_plan.length > 0) {
    await addMessage(userId, {
      sessionId,
      role: "ai",
      type: "plan",
      content: null,
      metadata: { result },
    });

    const { error: planError } = await supabase.from("self_care_plans").insert(
      result.self_care_plan.map((item) => ({
        user_id: userId,
        mood_log_id: sessionId,
        day_index: item.day,
        activity: item.activity,
        language: args.language,
      })),
    );
    if (planError) throw new Error(`saveAnalysis plans failed: ${planError.message}`);
  }
}

export async function listSessions(userId: string): Promise<SessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_logs")
    .select("id, title, created_at, source, fusion_result, crisis_triggered")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listSessions failed: ${error.message}`);
  return (data ?? []) as SessionRow[];
}

export async function getSessionMessages(
  userId: string,
  sessionId: string,
): Promise<ChatMessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, session_id, role, type, content, metadata, created_at")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getSessionMessages failed: ${error.message}`);
  return (data ?? []) as ChatMessageRow[];
}

export async function deleteSession(userId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mood_logs")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) throw new Error(`deleteSession failed: ${error.message}`);
}

/**
 * A session's own mood_logs row plus every self_care_plans row for it,
 * joined — mirrors Flutter's SessionService.fetchMoodLogs(). Used by the
 * Plan and Profile pages; History uses the lighter listSessions() above,
 * matching Flutter's own getSessions()/fetchMoodLogs() split.
 */
export async function fetchMoodLogs(userId: string): Promise<MoodLogWithPlans[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_logs")
    .select(
      "id, title, created_at, source, fusion_result, crisis_triggered, self_care_plans(id, mood_log_id, day_index, activity, language, completed_at, created_at)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`fetchMoodLogs failed: ${error.message}`);
  return (data ?? []) as unknown as MoodLogWithPlans[];
}

/** Marks one self-care day done/undone. RLS scopes this to rows the caller
 * owns (self_care_plans_update_own), so no explicit user_id check is needed
 * here — an id belonging to someone else simply updates zero rows. */
export async function toggleSelfCare(planId: string, completed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("self_care_plans")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", planId);
  if (error) throw new Error(`toggleSelfCare failed: ${error.message}`);
}
