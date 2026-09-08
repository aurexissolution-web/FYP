import {
  LogIn,
  MessageSquareText,
  ShieldAlert,
  BrainCircuit,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Step } from "@/lib/dictionaries/types";

/*
  The five pipeline steps from howItWorks.steps as a timeline: horizontal on
  large screens (a connector line grows across behind the nodes), vertical on
  small ones. Step 3 — the crisis check — is coral, because it is the one
  step that can stop everything after it.

  Wrap in <InView> for the entrance animation (`.grow-x` on the line, `.rise`
  on each step with a staggered delay).
*/
const ICONS: LucideIcon[] = [LogIn, MessageSquareText, ShieldAlert, BrainCircuit, Sparkles];
const CRISIS_STEP = 2;

export function Timeline({
  steps,
  overrideChip,
}: {
  steps: Step[];
  overrideChip: string;
}) {
  return (
    <ol className="relative grid gap-3 rounded-[2rem] bg-indigo-deep p-3 shadow-[0_24px_70px_rgba(46,42,58,0.2)] lg:grid-cols-5">
      {/* Vertical connector (mobile) */}
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-9 top-10 w-px bg-white/20 lg:hidden"
      />
      {/* Horizontal connector (desktop) — centres of columns 1 and 5 sit at 10% and 90% */}
      <div
        aria-hidden="true"
        className="grow-x absolute left-[10%] right-[10%] top-[3.25rem] hidden h-0.5 rounded-full bg-gradient-to-r from-sage via-white/50 to-coral lg:block"
      />

      {steps.map((s, i) => {
        const Icon = ICONS[i] ?? Sparkles;
        const crisis = i === CRISIS_STEP;
        return (
          <li
            key={s.title}
            className={`rise relative flex gap-4 overflow-hidden rounded-2xl border p-5 lg:min-h-[250px] lg:flex-col ${
              crisis
                ? "border-coral/60 bg-coral-tint"
                : "border-white/10 bg-white"
            }`}
            style={{ animationDelay: `${180 + i * 140}ms` }}
          >
            <span className={`absolute -right-1 top-0 text-7xl font-black leading-none ${crisis ? "text-coral/10" : "text-indigo/[0.06]"}`}>
              0{i + 1}
            </span>
            <div
              className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                crisis
                  ? "bg-coral-deep text-white"
                  : "bg-indigo-tint text-indigo"
              }`}
            >
              <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
              <span
                className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white ring-2 ring-white ${
                  crisis ? "bg-coral-deep" : "bg-indigo"
                }`}
              >
                {i + 1}
              </span>
            </div>

            <div className="relative z-10 flex flex-col gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold leading-tight text-ink">{s.title}</h3>
                {crisis && (
                  <span className="rounded-full bg-coral-deep px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                    {overrideChip}
                  </span>
                )}
              </div>
              <p className="text-[13px] leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
