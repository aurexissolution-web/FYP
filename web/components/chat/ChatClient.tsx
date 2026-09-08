"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, Send, ShieldAlert, Sparkles } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { AnalyzeResponse, ChatMessageRow } from "@/lib/chat/types";

type Bubble =
  | { kind: "text"; from: "user" | "ai"; text: string }
  | { kind: "plan"; result: AnalyzeResponse; notifiedContact?: string | null }
  | { kind: "notified"; name: string };

// Same three tints PhoneMockup/LiveDemo cycle through for each self-care
// day, so a plan looks like the same product whether it was generated on
// the marketing demo or a real session.
const DAY_TINTS = ["text-sage-deep", "text-blue", "text-coral-deep"];

const aiBubbleClass =
  "max-w-[85%] self-start rounded-2xl rounded-bl-md border border-outline/70 bg-white px-4 py-2.5 text-[15px] leading-relaxed text-ink";
const userBubbleClass =
  "max-w-[85%] self-end rounded-2xl rounded-br-md bg-indigo-tint px-4 py-2.5 text-[15px] leading-relaxed text-ink";

/**
 * Reconstructs the bubble sequence a live session would have produced, from
 * the rows saveAnalysis()/addMessage() actually wrote (see lib/chat/sessions.ts).
 * A non-crisis result arrives as two rows — 'mood' (the response text) then
 * 'plan' (the card) — so 'mood' contributes only its text; a crisis result is
 * one row carrying both, so it contributes text *and* the card, matching what
 * ChatClient.getPlan() pushes live.
 */
function messagesToBubbles(messages: ChatMessageRow[]): Bubble[] {
  const bubbles: Bubble[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      bubbles.push({ kind: "text", from: "user", text: m.content ?? "" });
      continue;
    }
    const result = (m.metadata as { result?: AnalyzeResponse } | null)?.result;
    if (m.type === "plan" && result) {
      bubbles.push({ kind: "plan", result });
    } else if (m.type === "crisis" && result) {
      bubbles.push({ kind: "text", from: "ai", text: m.content ?? result.response_message });
      bubbles.push({ kind: "plan", result });
    } else {
      bubbles.push({ kind: "text", from: "ai", text: m.content ?? "" });
    }
  }
  return bubbles;
}

export function ChatClient({
  lang,
  dict,
  initialSessionId,
}: {
  lang: Locale;
  dict: Dictionary["chat"];
  initialSessionId?: string;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>(
    initialSessionId ? [] : [{ kind: "text", from: "ai", text: dict.greeting }],
  );
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(initialSessionId));
  const [notice, setNotice] = useState<string | null>(null);

  // Resuming a session from History: load its stored messages once on mount.
  useEffect(() => {
    if (!initialSessionId) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/chat/sessions?id=${initialSessionId}`);
        if (!response.ok) throw new Error(String(response.status));
        const data: { messages: ChatMessageRow[] } = await response.json();
        if (!cancelled) setBubbles(messagesToBubbles(data.messages));
      } catch {
        if (!cancelled) {
          setBubbles([{ kind: "text", from: "ai", text: dict.errorReply }]);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only ever runs for the session this page mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, busy]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    setInput("");
    setBusy(true);
    setNotice(null);
    setBubbles((b) => [...b, { kind: "text", from: "user", text: message }]);

    try {
      const response = await fetch("/api/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message, language: lang }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const data = await response.json();
      setSessionId(data.sessionId);
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: data.reply }]);
      if (data.crisis && data.notifiedContact) {
        setBubbles((b) => [...b, { kind: "notified", name: data.notifiedContact }]);
      }
      if (data.persisted === false) setNotice(dict.notSaved);
    } catch {
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: dict.errorReply }]);
    } finally {
      setBusy(false);
    }
  }

  async function getPlan() {
    if (!sessionId || busy) return;
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, language: lang }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const result: AnalyzeResponse & { persisted: boolean; notifiedContact?: string | null } =
        await response.json();
      setBubbles((b) => [
        ...b,
        { kind: "text", from: "ai", text: result.response_message },
        { kind: "plan", result, notifiedContact: result.notifiedContact },
      ]);
      if (result.persisted === false) setNotice(dict.notSaved);
    } catch {
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: dict.errorPlan }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <h1 className="sr-only">{dict.title}</h1>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-6 sm:px-6">
          {loadingHistory && (
            <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-outline/70 bg-white px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot block h-1.5 w-1.5 rounded-full bg-ink-faint"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          )}

          {bubbles.map((bubble, i) =>
            bubble.kind === "text" ? (
              <div
                key={i}
                className={bubble.from === "user" ? userBubbleClass : aiBubbleClass}
              >
                <span className="sr-only">
                  {bubble.from === "user" ? dict.youLabel : dict.aiLabel}:{" "}
                </span>
                {bubble.text}
              </div>
            ) : bubble.kind === "notified" ? (
              <div
                key={i}
                className="flex max-w-[85%] items-center gap-1.5 self-start rounded-full bg-coral-tint px-3.5 py-2 text-xs font-bold text-coral-deep"
              >
                <ShieldAlert size={13} />
                {dict.contactNotified.replace("{name}", bubble.name)}
              </div>
            ) : bubble.result.crisis ? (
              <div
                key={i}
                className="flex max-w-[85%] flex-col gap-3 self-start rounded-2xl bg-coral-tint px-4 py-3.5"
              >
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-coral-deep" />
                  <p className="text-sm font-semibold leading-snug text-coral-deep">
                    {dict.crisisNotice}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {bubble.result.hotlines.map((h) => (
                    <a
                      key={h.phone}
                      href={`tel:${h.phone.replace(/[^\d+]/g, "")}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3.5 py-2.5 transition-colors hover:bg-white"
                    >
                      <span className="flex flex-col">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-coral-deep">
                          {h.name}
                        </span>
                        <span className="text-[13px] text-ink-soft">{h.description}</span>
                      </span>
                      <span className="shrink-0 text-sm font-extrabold tabular-nums text-ink">
                        {h.phone}
                      </span>
                    </a>
                  ))}
                </div>
                {bubble.notifiedContact && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-coral-deep">
                    <CircleCheck size={13} className="shrink-0" />
                    {dict.contactNotified.replace("{name}", bubble.notifiedContact)}
                  </p>
                )}
              </div>
            ) : (
              <div
                key={i}
                className="flex max-w-[85%] flex-col gap-2 self-start rounded-2xl bg-sage-tint px-4 py-3.5"
              >
                <span className="text-xs font-extrabold text-sage-deep">{dict.planTitle}</span>
                <div className="flex flex-col gap-2">
                  {bubble.result.self_care_plan.map((item, dayIndex) => (
                    <div key={item.day} className="flex items-start gap-2">
                      <CircleCheck
                        size={16}
                        className={`${DAY_TINTS[dayIndex % DAY_TINTS.length]} mt-0.5 shrink-0`}
                      />
                      <span className="text-sm leading-snug text-ink">
                        <span className="font-semibold">
                          {dict.dayLabel} {item.day}:
                        </span>{" "}
                        {item.activity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}

          {busy && (
            <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-outline/70 bg-white px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot block h-1.5 w-1.5 rounded-full bg-ink-faint"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-outline/60 bg-cream px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {sessionId && (
            <button
              type="button"
              onClick={getPlan}
              disabled={busy}
              className="inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-sage-tint px-3.5 py-1.5 text-xs font-bold text-sage-deep transition-colors hover:bg-sage/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={13} />
              {dict.getPlan}
            </button>
          )}

          {notice && (
            <p role="status" className="text-xs font-semibold text-amber">
              {notice}
            </p>
          )}

          <form onSubmit={send} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dict.inputPlaceholder}
              aria-label={dict.inputPlaceholder}
              disabled={busy}
              className="flex-1 rounded-full border border-outline bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint transition-colors focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/30"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label={dict.send}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo text-white transition-colors hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
