import type { AnalyzeResponse, ChatReplyResponse, Language } from "./types";

// Render's free tier cold-starts at roughly 50s. The platform default would
// abort well before that and look like an outage during judging.
const TIMEOUT_MS = 90_000;

export class MlServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MlServiceError";
    this.status = status;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const base = process.env.ML_SERVICE_URL;
  if (!base) throw new MlServiceError("ML_SERVICE_URL is not set", 500);

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (cause) {
    throw new MlServiceError(`ml-service unreachable: ${String(cause)}`, 502);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new MlServiceError(
      `ml-service ${path} returned ${response.status}: ${detail.slice(0, 200)}`,
      502,
    );
  }

  return (await response.json()) as T;
}

export function chatReply(messages: string[], language: Language) {
  return post<ChatReplyResponse>("/chat/reply", { messages, language });
}

export function analyzeConversation(messages: string[], language: Language) {
  return post<AnalyzeResponse>("/analyze/conversation", { messages, language });
}
