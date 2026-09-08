import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { notifyEmergencyContactIfCrisis } from "@/lib/chat/emergency";
import { analyzeConversation, MlServiceError } from "@/lib/chat/ml";
import { getUserMessages, saveAnalysis } from "@/lib/chat/sessions";
import type { Language } from "@/lib/chat/types";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sessionId = body.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "session_required" }, { status: 400 });
  }
  const language: Language = body.language === "ms" ? "ms" : "en";

  // RLS scopes this to the caller, so an unowned session reads as empty
  // rather than leaking another user's conversation.
  const messages = await getUserMessages(user.id, sessionId);
  if (messages.length === 0) {
    return NextResponse.json({ error: "session_empty" }, { status: 404 });
  }

  let result;
  try {
    result = await analyzeConversation(messages, language);
  } catch (error) {
    const status = error instanceof MlServiceError ? error.status : 502;
    return NextResponse.json({ error: "ml_service_failed" }, { status });
  }

  let persisted = true;
  try {
    await saveAnalysis(user.id, {
      sessionId,
      result,
      source: "text",
      language,
      conversationText: messages.join("\n"),
    });
  } catch {
    persisted = false;
  }

  let notifiedContact: string | null = null;
  if (result.crisis) {
    try {
      const contact = await notifyEmergencyContactIfCrisis(user.id, sessionId);
      notifiedContact = contact?.name ?? null;
    } catch {
      notifiedContact = null;
    }
  }

  return NextResponse.json({ ...result, persisted, notifiedContact });
}
