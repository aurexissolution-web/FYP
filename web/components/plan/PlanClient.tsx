"use client";

import { useState } from "react";
import Link from "next/link";
import { Circle, CircleCheck, MessageCircleHeart, Sparkles } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { MoodLogWithPlans } from "@/lib/chat/types";
import { MOOD_EMOJI, MOOD_TINT } from "@/lib/mood";

const DAY_TINTS = ["text-sage-deep", "text-blue", "text-coral-deep"];

function DayRow({
  dayLabel,
  day,
  activity,
  completed,
  tint,
  onToggle,
}: {
  dayLabel: string;
  day: number;
  activity: string;
  completed: boolean;
  tint: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-all hover:border-outline/60 hover:bg-white/70"
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${completed ? "bg-sage-tint" : "bg-cream-alt"}`}>
        {completed ? (
          <CircleCheck size={17} className={tint} />
        ) : (
          <Circle size={17} className="text-ink-faint" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-faint">{dayLabel} {day}</span>
        <span className={`mt-1 block text-sm leading-relaxed ${completed ? "text-ink-faint line-through" : "text-ink"}`}>{activity}</span>
      </span>
    </button>
  );
}

export function PlanClient({
  lang,
  dict,
  dayLabel,
  initialLogs,
}: {
  lang: Locale;
  dict: Dictionary["plan"];
  dayLabel: string;
  initialLogs: MoodLogWithPlans[];
}) {
  const [logs, setLogs] = useState(initialLogs);

  async function toggle(planId: string, completed: boolean) {
    // Optimistic update — a failed PATCH is rare and low-stakes here, so we
    // don't roll back on error; a refresh will simply show the true state.
    setLogs((prev) =>
      prev.map((log) => ({
        ...log,
        self_care_plans: log.self_care_plans.map((p) =>
          p.id === planId ? { ...p, completed_at: completed ? new Date().toISOString() : null } : p,
        ),
      })),
    );

    try {
      await fetch("/api/chat/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, completed }),
      });
    } catch {
      // Swallowed deliberately — see comment above.
    }
  }

  const withPlans = logs.filter((l) => l.self_care_plans.length > 0);

  if (withPlans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-outline/70 bg-white px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-tint text-sage-deep">
          <MessageCircleHeart size={22} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-bold text-ink">{dict.emptyTitle}</p>
          <p className="text-sm text-ink-soft">{dict.emptyBody}</p>
        </div>
        <Link
          href={`/${lang}/chat`}
          className="rounded-full bg-indigo px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-deep"
        >
          {dict.startChat}
        </Link>
      </div>
    );
  }

  const [active, ...previous] = withPlans;

  const renderPlanCard = (log: MoodLogWithPlans, title: string, featured = false) => {
    const tint = MOOD_TINT[log.fusion_result];
    const days = [...log.self_care_plans].sort((a, b) => a.day_index - b.day_index);
    const complete = days.filter((day) => day.completed_at).length;
    const progress = days.length ? Math.round((complete / days.length) * 100) : 0;
    return (
      <article key={log.id} className={`relative overflow-hidden rounded-[1.75rem] border p-5 sm:p-6 ${featured ? "border-indigo/15 bg-white shadow-[0_25px_65px_-38px_rgba(74,63,99,0.55)]" : "border-white bg-white/75 ring-1 ring-outline/40"}`}>
        {featured && <div aria-hidden="true" className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-indigo-tint/75 blur-2xl" />}
        <div className="relative flex items-start justify-between gap-4 border-b border-outline/50 pb-5">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${tint.bg}`}>{MOOD_EMOJI[log.fusion_result]}</span>
            <div className="flex flex-col">
              <span className={`${featured ? "text-lg" : "text-sm"} font-extrabold tracking-tight text-ink`}>{title}</span>
              <span className="mt-0.5 text-xs text-ink-faint">
                {new Date(log.created_at).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold tabular-nums text-ink">{progress}%</span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink-faint">{dict.progress}</span>
          </div>
        </div>
        <div className="relative mt-3 flex flex-col gap-1">
          {days.map((p, i) => (
            <DayRow key={p.id} dayLabel={dayLabel} day={p.day_index} activity={p.activity} completed={Boolean(p.completed_at)} tint={DAY_TINTS[i % DAY_TINTS.length]} onToggle={() => toggle(p.id, !p.completed_at)} />
          ))}
        </div>
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-cream-alt">
          <span className="block h-full rounded-full bg-gradient-to-r from-indigo to-sage transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </article>
    );
  };

  return (
    <div className="flex flex-col gap-9">
      <section>
        <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo">
          <Sparkles size={13} />
          {dict.activeTitle}
        </div>
        {renderPlanCard(active, dict.activeTitle, true)}
      </section>

      {previous.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between border-b border-outline/60 pb-3">
            <h2 className="text-sm font-extrabold text-ink">{dict.previousTitle}</h2>
            <span className="text-2xl font-extrabold text-ink/15 tabular-nums">{String(previous.length).padStart(2, "0")}</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {previous.map((log) => renderPlanCard(log, log.title ?? dict.previousTitle))}
          </div>
        </section>
      )}
    </div>
  );
}
