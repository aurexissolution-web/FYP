"use client";

import { useEffect, useRef, useState } from "react";
import { Send, CircleCheck, ShieldCheck } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { CHECK_TINTS } from "./PhoneMockup";
import { DEMO_SCRIPT, type DemoLang } from "@/lib/demo-script";

/*
  Auto-playing replay of one text check-in, looping and alternating between
  English and Bahasa Melayu. Five callouts beside the phone light up as the
  replay reaches each stage.

  Rendering rules:
  - The server renders the FINISHED state (every message, the plan, all
    callouts lit). No-JS visitors and Reduce Motion users see exactly that.
  - The scheduler only runs while the component is on screen and the tab is
    visible; leaving the viewport freezes it, returning restarts the loop.
  - Timers are tracked and cleared on every cleanup.
*/
type Phase =
  | "idle"
  | "typing"
  | "sent"
  | "crisis"
  | "text"
  | "decided"
  | "reply"
  | "plan"
  | "fade";

const ORDER: Phase[] = [
  "idle",
  "typing",
  "sent",
  "crisis",
  "text",
  "decided",
  "reply",
  "plan",
  "fade",
];
const S = Object.fromEntries(ORDER.map((p, i) => [p, i])) as Record<Phase, number>;

// Which phase lights each of the five callouts.
const CALLOUT_PHASE: Phase[] = ["sent", "crisis", "text", "decided", "reply"];

const TYPE_MS = 38;

export type DemoCallout = { title: string; detail: string };

export function LiveDemo({
  initialLang,
  callouts,
  replayNote,
}: {
  initialLang: DemoLang;
  callouts: DemoCallout[];
  replayNote: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<DemoLang>(initialLang);

  // Finished state first — see rendering rules above.
  const [phase, setPhase] = useState<Phase>("plan");
  const [lang, setLang] = useState<DemoLang>(initialLang);
  const [typed, setTyped] = useState<number>(DEMO_SCRIPT[initialLang].userMsg.length);
  const [active, setActive] = useState(false);

  // On screen + tab visible → active
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // The replay loop
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const timeouts: number[] = [];
    const intervals: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timeouts.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    const runLoop = (l: DemoLang) => {
      const script = DEMO_SCRIPT[l];
      const chain: Array<[Phase, number]> = [
        ["idle", 700],
        ["typing", script.userMsg.length * TYPE_MS + 350],
        ["sent", 650],
        ["crisis", 900],
        ["text", 1100],
        ["decided", 900],
        ["reply", 1000],
        ["plan", 4200],
        ["fade", 500],
      ];
      let at = 0;
      for (const [p, ms] of chain) {
        later(() => {
          langRef.current = l;
          setLang(l);
          setPhase(p);
          if (p === "idle") setTyped(0);
          if (p === "typing") {
            let n = 0;
            const id = window.setInterval(() => {
              n += 1;
              setTyped(n);
              if (n >= script.userMsg.length) window.clearInterval(id);
            }, TYPE_MS);
            intervals.push(id);
          }
        }, at);
        at += ms;
      }
      later(() => runLoop(l === "en" ? "ms" : "en"), at);
    };

    later(() => runLoop(langRef.current), 0);

    return () => {
      cancelled = true;
      timeouts.forEach(window.clearTimeout);
      intervals.forEach(window.clearInterval);
    };
  }, [active]);

  const script = DEMO_SCRIPT[lang];
  const stage = S[phase];
  const showTyping = stage >= S.text && stage < S.reply;

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <div className="flex flex-col items-center gap-4">
        <div
          ref={rootRef}
          className={`w-full max-w-[340px] transition-opacity duration-500 ${
            phase === "fade" ? "opacity-0" : "opacity-100"
          }`}
        >
          <PhoneFrame langChip={script.chip}>
            <div className="flex h-[430px] flex-col gap-2.5 px-3.5 py-4">
              {stage >= S.sent && (
                <div className="fade-up-in max-w-[85%] self-end rounded-2xl rounded-br-md bg-indigo-tint px-3.5 py-2.5 text-[13px] leading-snug text-ink">
                  {script.userMsg}
                </div>
              )}

              {stage >= S.crisis && (
                <div className="fade-up-in inline-flex items-center gap-1.5 self-start rounded-full bg-sage-tint px-2.5 py-1 text-[11px] font-bold text-sage-deep">
                  <ShieldCheck size={12} aria-hidden="true" />
                  {script.crisisPassed}
                </div>
              )}

              {showTyping && (
                <div className="fade-up-in flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-outline/70 bg-white px-3.5 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="typing-dot block h-1.5 w-1.5 rounded-full bg-ink-faint"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </div>
              )}

              {stage >= S.decided && (
                <div className="fade-up-in inline-flex items-center gap-1.5 self-start rounded-full bg-indigo-tint px-2.5 py-1 text-[11px] font-bold text-indigo">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo" aria-hidden="true" />
                  {script.detected}: {script.emotion}
                </div>
              )}

              {stage >= S.reply && (
                <div className="fade-up-in max-w-[85%] self-start rounded-2xl rounded-bl-md border border-outline/70 bg-white px-3.5 py-2.5 text-[13px] leading-snug text-ink">
                  {script.aiMsg}
                </div>
              )}

              {stage >= S.plan && (
                <div className="fade-up-in mt-1 flex flex-col gap-2 rounded-2xl bg-sage-tint px-3.5 py-3">
                  <span className="text-[12px] font-extrabold text-sage-deep">
                    {script.planTitle}
                  </span>
                  {script.planDays.map((day, i) => (
                    <div
                      key={day}
                      className="fade-up-in flex items-start gap-2"
                      style={{ animationDelay: `${300 + i * 260}ms` }}
                    >
                      <CircleCheck
                        size={14}
                        className={`${CHECK_TINTS[i]} mt-0.5 shrink-0`}
                        aria-hidden="true"
                      />
                      <span className="text-[12px] leading-snug text-ink">{day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="mt-auto flex items-center gap-2 border-t border-outline/60 bg-white px-3.5 py-3">
              <div className="min-h-[38px] flex-1 rounded-full bg-cream-alt px-3.5 py-2.5 text-[12px]">
                {phase === "typing" ? (
                  <span className="text-ink">
                    {script.userMsg.slice(0, typed)}
                    <span
                      className="typing-dot ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-ink"
                      aria-hidden="true"
                    />
                  </span>
                ) : (
                  <span className="text-ink-faint">{script.placeholder}</span>
                )}
              </div>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-300 ${
                  phase === "typing" ? "bg-indigo" : "bg-indigo/50"
                }`}
              >
                <Send size={15} aria-hidden="true" />
              </div>
            </div>
          </PhoneFrame>
        </div>
        <p className="max-w-[340px] text-center text-xs leading-relaxed text-ink-faint">
          {replayNote}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {callouts.map((c, i) => {
          const on = stage >= S[CALLOUT_PHASE[i]];
          return (
            <li
              key={c.title}
              className={`flex gap-4 rounded-2xl border p-4 transition-all duration-500 ${
                on
                  ? "border-indigo/40 bg-surface shadow-[0_14px_34px_-20px_rgba(46,42,58,0.4)]"
                  : "border-outline/60 bg-surface/40"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors duration-500 ${
                  on ? "bg-indigo text-white" : "bg-cream-alt text-ink-faint"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span
                  className={`font-bold transition-colors duration-500 ${
                    on ? "text-ink" : "text-ink-faint"
                  }`}
                >
                  {c.title}
                </span>
                <span
                  className={`text-sm leading-snug transition-colors duration-500 ${
                    on ? "text-ink-soft" : "text-ink-faint/70"
                  }`}
                >
                  {c.detail}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
