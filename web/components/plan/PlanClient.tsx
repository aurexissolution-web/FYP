"use client";

import { useState } from "react";
import Link from "next/link";
import { Circle, CircleCheck, MessageCircleHeart } from "lucide-react";
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
      className="flex w-full items-start gap-2.5 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-cream-alt"
    >
      {completed ? (
        <CircleCheck size={18} className={`mt-0.5 shrink-0 ${tint}`} />
      ) : (
        <Circle size={18} className="mt-0.5 shrink-0 text-ink-faint" />
      )}
      <span
        className={`text-sm leading-snug ${completed ? "text-ink-faint line-through" : "text-ink"}`}
      >
        <span className="font-semibold">
          {dayLabel} {day}:
        </span>{" "}
        {activity}
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

  const renderPlanCard = (log: MoodLogWithPlans, title: string) => {
    const tint = MOOD_TINT[log.fusion_result];
    const days = [...log.self_care_plans].sort((a, b) => a.day_index - b.day_index);
    return (
      <div key={log.id} className="rounded-2xl border border-outline/70 bg-white p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${tint.bg}`}>
            {MOOD_EMOJI[log.fusion_result]}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-ink">{title}</span>
            <span className="text-xs text-ink-faint">
              {new Date(log.created_at).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {days.map((p, i) => (
            <DayRow
              key={p.id}
              dayLabel={dayLabel}
              day={p.day_index}
              activity={p.activity}
              completed={Boolean(p.completed_at)}
              tint={DAY_TINTS[i % DAY_TINTS.length]}
              onToggle={() => toggle(p.id, !p.completed_at)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {renderPlanCard(active, dict.activeTitle)}

      {previous.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-faint">
            {dict.previousTitle}
          </h2>
          <div className="flex flex-col gap-3">
            {previous.map((log) => renderPlanCard(log, log.title ?? dict.previousTitle))}
          </div>
        </div>
      )}
    </div>
  );
}
