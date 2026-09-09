"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, MessageCircle, Mic, Send, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { AnalyzeResponse, ChatMessageRow } from "@/lib/chat/types";
import { getHotlines, type HotlineEntry } from "@/lib/hotlines";

type Bubble =
  | { kind: "text"; from: "user" | "ai"; text: string }
  | { kind: "plan"; result: AnalyzeResponse; notifiedContact?: string | null }
  | { kind: "crisis"; hotlines: HotlineEntry[]; notifiedContact?: string | null }
  | { kind: "notified"; name: string };

// Same three tints PhoneMockup/LiveDemo cycle through for each self-care
// day, so a plan looks like the same product whether it was generated on
// the marketing demo or a real session.
const DAY_TINTS = ["text-sage-deep", "text-blue", "text-coral-deep"];

const aiBubbleClass =
  "max-w-[82%] self-start rounded-[1.25rem] rounded-bl-md border border-white bg-white/90 px-4 py-3 text-[15px] leading-relaxed text-ink shadow-[0_12px_30px_-24px_rgba(46,42,58,0.45)]";
const userBubbleClass =
  "max-w-[82%] self-end rounded-[1.25rem] rounded-br-md bg-indigo px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_12px_30px_-22px_rgba(74,63,99,0.65)]";

/**
 * Reconstructs the bubble sequence a live session would have produced, from
 * the rows saveAnalysis()/addMessage() actually wrote (see lib/chat/sessions.ts).
 * A non-crisis result arrives as two rows — 'mood' (the response text) then
 * 'plan' (the card) — so 'mood' contributes only its text; a crisis result is
 * one row carrying both, so it contributes text *and* the card, matching what
 * ChatClient.getPlan() pushes live.
 */
function messagesToBubbles(messages: ChatMessageRow[], lang: Locale): Bubble[] {
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
    } else if (m.type === "crisis") {
      // A crisis from /chat/reply is stored with no analyze result, so the
      // hotlines have to be re-attached when the session is reloaded.
      bubbles.push({ kind: "text", from: "ai", text: m.content ?? "" });
      bubbles.push({ kind: "crisis", hotlines: getHotlines(lang) });
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
        if (!cancelled) setBubbles(messagesToBubbles(data.messages, lang));
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
      if (data.crisis) {
        setBubbles((b) => [
          ...b,
          {
            kind: "crisis",
            hotlines: (data.hotlines?.length ? data.hotlines : getHotlines(lang)) as HotlineEntry[],
            notifiedContact: data.notifiedContact ?? null,
          },
        ]);
      } else if (data.notifiedContact) {
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

  const isFresh = !sessionId && !loadingHistory && bubbles.length === 1;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f8f6fa]">
      <div aria-hidden="true" className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-indigo-tint/45 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-36 bottom-0 h-80 w-80 rounded-full bg-sage-tint/55 blur-3xl" />
      <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <h1 className="sr-only">{dict.title}</h1>

      <div className="relative flex-1 overflow-y-auto">
        <div className={`mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 ${isFresh ? "justify-center pb-20" : "justify-start"}`}>
          {isFresh && (
            <div className="mx-auto w-full">
              <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo text-white shadow-[0_16px_35px_-18px_rgba(74,63,99,0.8)]">
                        <Sparkles size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <span className="text-sm font-extrabold text-ink">EmoBuddy</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-sage-deep">
                          <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />
                          {dict.aiLabel}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full border border-outline/60 bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">EN · BM</span>
                  </div>

                  <h2 className="mt-8 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-ink text-balance sm:text-5xl">{dict.greeting}</h2>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">{dict.welcomeSubtitle}</p>
                </div>

                <div className="relative hidden h-[290px] place-items-center lg:grid" aria-hidden="true">
                  <div className="absolute h-64 w-64 rounded-full border border-indigo/10" />
                  <div className="absolute h-48 w-48 rounded-full border border-dashed border-indigo/20" />
                  <div className="absolute h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-indigo via-[#8f7aad] to-sage shadow-[0_35px_70px_-28px_rgba(74,63,99,0.65)] rotate-12" />
                  <div className="absolute grid h-24 w-24 place-items-center rounded-[2rem] border border-white/50 bg-white/20 text-white backdrop-blur-md -rotate-6">
                    <Sparkles size={32} />
                  </div>
                  <span className="absolute left-7 top-9 grid h-12 w-12 place-items-center rounded-2xl border border-white bg-white/90 text-indigo shadow-lg"><MessageCircle size={19} /></span>
                  <span className="absolute bottom-8 left-16 grid h-12 w-12 place-items-center rounded-2xl border border-white bg-white/90 text-coral-deep shadow-lg"><Mic size={19} /></span>
                  <span className="absolute right-5 top-20 grid h-12 w-12 place-items-center rounded-2xl border border-white bg-white/90 text-sage-deep shadow-lg"><ShieldCheck size={19} /></span>
                  <span className="absolute bottom-8 right-12 rounded-full border border-white bg-white/90 px-3 py-2 text-[10px] font-extrabold tracking-[0.16em] text-indigo shadow-lg">EN · BM</span>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {dict.prompts.map((prompt, index) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className={`group flex min-h-28 flex-col justify-between rounded-2xl border p-4 text-left shadow-[0_15px_40px_-30px_rgba(46,42,58,0.5)] transition-all hover:-translate-y-1 ${index === 0 ? "border-coral/20 bg-coral-tint/55" : index === 1 ? "border-indigo/15 bg-indigo-tint/55" : "border-sage/20 bg-sage-tint/60"}`}
                  >
                    <span className="text-[10px] font-extrabold tracking-[0.16em] text-ink-faint">0{index + 1}</span>
                    <span className="flex items-end justify-between gap-3 text-sm font-bold leading-snug text-ink">
                      {prompt}
                      <Send size={14} className="shrink-0 text-indigo opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isFresh && (
            <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-white bg-white/75 p-3 shadow-[0_16px_40px_-32px_rgba(46,42,58,0.45)] ring-1 ring-outline/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo text-white"><Sparkles size={17} /></span>
                <div>
                  <h2 className="text-sm font-extrabold text-ink">{dict.title}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-sage-deep"><span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />{dict.aiLabel} · EN/BM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sessionId && (
                  <button type="button" onClick={getPlan} disabled={busy} className="hidden items-center gap-1.5 rounded-xl bg-sage-tint px-3.5 py-2 text-xs font-bold text-sage-deep transition-colors hover:bg-sage/25 disabled:opacity-50 sm:inline-flex">
                    <Sparkles size={13} />{dict.getPlan}
                  </button>
                )}

              </div>
            </div>
          )}
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

          {!isFresh && bubbles.map((bubble, i) =>
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
            ) : bubble.kind === "crisis" ? (
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
                  {bubble.hotlines.map((h) => (
                    <a
                      key={h.phone}
                      href={h.telHref}
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

      <div className="relative shrink-0 px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-[1.4rem] border border-white bg-white/85 p-2.5 shadow-[0_22px_55px_-26px_rgba(46,42,58,0.4)] ring-1 ring-outline/40 backdrop-blur-xl">
          {sessionId && (
            <button
              type="button"
              onClick={getPlan}
              disabled={busy}
              className="inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-sage-tint px-3.5 py-1.5 text-xs font-bold text-sage-deep transition-colors hover:bg-sage/25 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
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
              className="flex-1 rounded-xl border-0 bg-transparent px-3 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label={dict.send}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo text-white shadow-[0_10px_24px_-10px_rgba(74,63,99,0.75)] transition-all hover:-translate-y-0.5 hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
