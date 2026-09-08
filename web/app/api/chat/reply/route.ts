import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { notifyEmergencyContactIfCrisis } from "@/lib/chat/emergency";
import { chatReply, MlServiceError } from "@/lib/chat/ml";
import { addMessage, createSession, getUserMessages } from "@/lib/chat/sessions";
import type { Language } from "@/lib/chat/types";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; message?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }
  const language: Language = body.language === "ms" ? "ms" : "en";

  // Session first: the user's message must be durable before we spend time
  // waiting on a possibly cold-starting ml-service.
  const sessionId = body.sessionId ?? (await createSession(user.id, message));
  await addMessage(user.id, {
    sessionId,
    role: "user",
    type: "text",
    content: message,
  });

  const history = await getUserMessages(user.id, sessionId);

  let result;
  try {
    result = await chatReply(history.length > 0 ? history : [message], language);
  } catch (error) {
    const status = error instanceof MlServiceError ? error.status : 502;
    return NextResponse.json(
      { error: "ml_service_failed", sessionId },
      { status },
    );
  }

  // The reply is already generated. If persisting it fails, still return it —
  // a lost row must not look to the user like the chatbot broke.
  let persisted = true;
  try {
    await addMessage(user.id, {
      sessionId,
      role: "ai",
      type: result.crisis ? "crisis" : "text",
      content: result.reply,
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
      // Best-effort — a failed audit-row insert must not hide the crisis
      // reply itself from the user.
      notifiedContact = null;
    }
  }

  return NextResponse.json({
    sessionId,
    reply: result.reply,
    crisis: result.crisis,
    persisted,
    notifiedContact,
  });
}
