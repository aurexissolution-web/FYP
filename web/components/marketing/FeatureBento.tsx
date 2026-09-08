import {
  Languages,
  Mic,
  ListChecks,
  LockKeyhole,
  ShieldAlert,
  Phone,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary, FeatureItem } from "@/lib/dictionaries/types";
import { CHECK_TINTS } from "./PhoneMockup";

/*
  Five feature tiles, each with a small CSS-only visual. The copy is
  home.features; the visuals use illustrative UI text from home.bento plus the
  real Talian Kasih hotline. All animation is ambient (loops) and disabled
  under Reduce Motion.
*/
type Bento = Dictionary["home"]["bento"];

const ICONS: LucideIcon[] = [Languages, Mic, ListChecks, LockKeyhole, ShieldAlert];
const WAVE_HEIGHTS = [14, 26, 38, 22, 44, 30, 18, 40, 24, 34, 16];

function Tile({
  icon: Icon,
  title,
  body,
  visual,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  visual: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      // Hover lift uses `transform`, not Tailwind's `translate` utilities: the
      // scroll-driven `reveal` animation holds the `translate` property, and
      // an animation's fill value would override any hover translate.
      className={`reveal group flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-30px_rgba(46,42,58,0.45)] ring-1 ring-indigo/[0.05] backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 hover:border-indigo/20 hover:[transform:translateY(-5px)] hover:shadow-[0_28px_60px_-28px_rgba(74,63,99,0.4)] ${className}`}
    >
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cream via-white to-indigo-tint/45 ring-1 ring-indigo/[0.05]">
        <div aria-hidden="true" className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-sage/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="relative z-10 flex h-full w-full items-center justify-center">{visual}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-tint text-indigo transition-colors group-hover:bg-indigo group-hover:text-white">
            <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <h3 className="text-base font-extrabold text-ink">{title}</h3>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-soft">{body}</p>
      </div>
    </li>
  );
}

export function FeatureBento({
  features,
  bento,
  planDays,
  hotlineName,
  hotlineNumber,
}: {
  features: FeatureItem[];
  bento: Bento;
  planDays: readonly string[];
  hotlineName: string;
  hotlineNumber: string;
}) {
  const visuals: React.ReactNode[] = [
    // 1 · Bilingual — the same thought, crossfading between languages
    <div key="bilingual" className="relative h-20 w-full max-w-[280px]">
      <div className="xfade-a absolute inset-0 flex items-center justify-center">
        <span className="rounded-2xl rounded-bl-md border border-outline/70 bg-white px-4 py-2.5 text-sm text-ink shadow-sm">
          {bento.sampleEn}
        </span>
        <span className="absolute -right-1 -top-2 rounded-full bg-sage-tint px-2 py-0.5 text-[10px] font-extrabold text-sage-deep">
          EN
        </span>
      </div>
      <div className="xfade-b absolute inset-0 flex items-center justify-center">
        <span className="rounded-2xl rounded-bl-md border border-outline/70 bg-white px-4 py-2.5 text-sm text-ink shadow-sm">
          {bento.sampleMs}
        </span>
        <span className="absolute -right-1 -top-2 rounded-full bg-indigo-tint px-2 py-0.5 text-[10px] font-extrabold text-indigo">
          BM
        </span>
      </div>
    </div>,

    // 2 · Voice or text — a live waveform beside a text cursor
    <div key="voice" className="flex items-center gap-5">
      <div className="flex h-12 items-center gap-1">
        {WAVE_HEIGHTS.map((hgt, i) => (
          <span
            key={i}
            className="wave block w-1 rounded-full bg-sage-deep"
            style={{ height: hgt, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-sm">
        Aa
        <span className="typing-dot ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-ink" />
      </span>
    </div>,

    // 3 · Plan — three days ticking off in sequence
    <ul key="plan" className="flex w-full max-w-[250px] flex-col gap-2">
      {planDays.slice(0, 3).map((day, i) => (
        <li key={day} className="flex items-center gap-2">
          <CircleCheck
            size={16}
            className={`tick-loop shrink-0 ${CHECK_TINTS[i]}`}
            style={{ animationDelay: `${i * 600}ms` }}
            aria-hidden="true"
          />
          <span className="truncate text-xs text-ink">{day}</span>
        </li>
      ))}
    </ul>,

    // 4 · Private history — faint entries behind a lock
    <div key="history" className="relative flex w-full max-w-[250px] flex-col gap-1.5">
      {bento.historyRows.map((row) => (
        <span
          key={row}
          className="truncate rounded-lg bg-white/70 px-3 py-1.5 text-[11px] text-ink-faint"
        >
          {row}
        </span>
      ))}
      <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-1.5 rounded-full bg-indigo px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
        <LockKeyhole size={11} aria-hidden="true" />
        {bento.onlyYou}
      </span>
    </div>,

    // 5 · Crisis-safe — the real hotline, pulsing
    <div key="crisis" className="flex items-center gap-4">
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="pulse-ring absolute inset-0 rounded-full bg-coral/50" aria-hidden="true" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-coral-deep text-white">
          <Phone size={20} aria-hidden="true" />
        </span>
      </span>
      <span className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wide text-coral-deep">
          {hotlineName}
        </span>
        <span className="text-2xl font-extrabold tracking-tight text-ink tabular-nums">
          {hotlineNumber}
        </span>
      </span>
    </div>,
  ];

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((f, i) => (
        <Tile
          key={f.title}
          icon={ICONS[i] ?? Languages}
          title={f.title}
          body={f.body}
          visual={visuals[i]}
          className={i === 0 ? "lg:col-span-2" : ""}
        />
      ))}
    </ul>
  );
}
