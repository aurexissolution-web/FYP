"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  History,
  Languages,
  ListChecks,
  Mic,
  MicOff,
  Scale,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { FeatureItem } from "@/lib/dictionaries/types";

const ICONS: LucideIcon[] = [Languages, Mic, Scale, ListChecks, ShieldAlert, History, MicOff];
const COLORS = ["#6B5B8A", "#3F7E78", "#B85F4F", "#C48332", "#B85F4F", "#6B5B8A", "#3F7E78"];

export function FeatureSculpture({ items }: { items: FeatureItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];
  const ActiveIcon = ICONS[activeIndex] ?? Languages;
  const selectOffset = (offset: number) => setActiveIndex((activeIndex + offset + items.length) % items.length);

  return (
    <div className="grid items-stretch overflow-hidden rounded-[2.25rem] border border-white/60 bg-[#1c1a22] shadow-[0_38px_110px_-38px_rgba(28,26,34,0.7)] lg:grid-cols-[0.72fr_1fr_1.08fr]">
      <div className="flex flex-col justify-center border-b border-white/10 bg-[#211f28] p-3 lg:border-b-0 lg:border-r">
        {items.map((item, index) => {
          const Icon = ICONS[index] ?? Languages;
          const selected = index === activeIndex;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-pressed={selected}
              className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-left transition-all ${selected ? "bg-white text-ink shadow-lg" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}
            >
              <span className="text-[9px] font-extrabold tabular-nums opacity-45">0{index + 1}</span>
              <Icon size={15} className="shrink-0" style={{ color: selected ? COLORS[index] : undefined }} aria-hidden="true" />
              <span className="flex-1 text-[11px] font-bold leading-tight sm:text-xs">{item.title}</span>
              <span className={`h-1.5 w-1.5 rounded-full transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} style={{ backgroundColor: COLORS[index] }} />
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden bg-[#151319]">
        <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:100%_32px]" />
        <svg aria-hidden="true" className="absolute h-[88%] w-[88%]" viewBox="0 0 500 500">
          <defs>
            <linearGradient id="sculpture-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#CEC2E8" />
              <stop offset="42%" stopColor="#6B5B8A" />
              <stop offset="72%" stopColor="#7FB9B4" />
              <stop offset="100%" stopColor="#E08C7E" />
            </linearGradient>
            <linearGradient id="sculpture-b" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
              <stop offset="45%" stopColor="#9AD8D2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6B5B8A" stopOpacity="0.12" />
            </linearGradient>
            <filter id="sculpture-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="24" stdDeviation="22" floodColor="#000000" floodOpacity="0.55" />
            </filter>
          </defs>
          <g filter="url(#sculpture-shadow)" transform="rotate(-8 250 250)">
            <path d="M114 286 C90 176 180 92 282 118 C372 141 422 238 369 322 C319 401 205 414 145 338 C195 365 265 354 299 304 C337 249 306 181 245 169 C182 156 130 207 144 270Z" fill="url(#sculpture-a)" />
            <path d="M144 270 C130 207 182 156 245 169 C306 181 337 249 299 304 C265 354 195 365 145 338 C174 360 222 349 249 311 C282 265 263 213 220 199 C177 185 143 220 151 262Z" fill="url(#sculpture-b)" />
            <path d="M114 286 C90 176 180 92 282 118" fill="none" stroke="white" strokeOpacity="0.58" strokeWidth="2" />
          </g>
          {items.map((item, index) => {
            const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2;
            const x = 250 + Math.cos(angle) * 205;
            const y = 250 + Math.sin(angle) * 205;
            return <circle key={item.title} cx={x} cy={y} r={index === activeIndex ? 7 : 3.5} fill={COLORS[index]} stroke="white" strokeWidth={index === activeIndex ? 3 : 1} strokeOpacity="0.7" />;
          })}
        </svg>
        <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/15 bg-black/30 text-center backdrop-blur-md">
          <span className="text-3xl font-extrabold text-white">07</span>
          <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-sage">EmoBuddy</span>
        </div>
      </div>

      <div className="relative flex min-h-[460px] flex-col justify-between overflow-hidden bg-[#f6f3ef] p-7 text-ink sm:p-9">
        <span aria-hidden="true" className="absolute -right-3 -top-8 text-[10rem] font-black leading-none text-indigo/[0.04]">0{activeIndex + 1}</span>
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg" style={{ backgroundColor: COLORS[activeIndex] }}>
              <ActiveIcon size={21} aria-hidden="true" />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-ink-faint">0{activeIndex + 1} / 07</span>
          </div>
          <h3 className="mt-10 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{active.title}</h3>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft sm:text-base">{active.body}</p>
        </div>
        <div className="relative mt-8 flex items-center justify-between border-t border-outline/70 pt-5">
          <div className="flex gap-1.5">
            {items.map((item, index) => (
              <button key={item.title} type="button" onClick={() => setActiveIndex(index)} aria-label={item.title} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-7" : "w-2.5 bg-outline"}`} style={index === activeIndex ? { backgroundColor: COLORS[index] } : undefined} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => selectOffset(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-outline text-ink transition-colors hover:bg-white" aria-label="Previous feature"><ArrowLeft size={15} /></button>
            <button type="button" onClick={() => selectOffset(1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-indigo" aria-label="Next feature"><ArrowRight size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
