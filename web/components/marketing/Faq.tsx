"use client";

import { useState } from "react";
import { ArrowUpRight, MessageCircleQuestion } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute -inset-x-3 inset-y-5 -z-10 rounded-[2.2rem] border border-indigo/10 bg-indigo/10" />
      <div aria-hidden="true" className="absolute -inset-x-6 inset-y-10 -z-20 rounded-[2.4rem] border border-indigo/[0.06] bg-indigo/[0.05]" />
      <div className="grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_34px_100px_-32px_rgba(46,42,58,0.52)] backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-center gap-2 border-b border-outline/60 bg-cream/70 p-4 lg:border-b-0 lg:border-r">
        {items.map((item, index) => {
          const activeItem = index === activeIndex;
          return (
            <button
              key={item.q}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-pressed={activeItem}
              className={`group flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all ${
                activeItem
                  ? "bg-indigo text-white shadow-[0_12px_28px_-16px_rgba(74,63,99,0.65)]"
                  : "text-ink hover:bg-white"
              }`}
            >
              <span className={`text-[10px] font-extrabold tabular-nums ${activeItem ? "text-sage" : "text-indigo/45"}`}>
                0{index + 1}
              </span>
              <span className="flex-1 text-xs font-bold leading-snug sm:text-sm">{item.q}</span>
              <ArrowUpRight
                size={15}
                className={`shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${activeItem ? "text-sage" : "text-ink-faint"}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden p-8 sm:p-11">
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[44px] border-indigo/[0.035]" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full border-[50px] border-sage/[0.055]" />
        <div className="relative">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-tint text-indigo">
            <MessageCircleQuestion size={21} aria-hidden="true" />
          </span>
          <span className="mt-8 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage-deep">
            Q / 0{activeIndex + 1}
          </span>
          <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
            {active.q}
          </h3>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft sm:text-base">{active.a}</p>
        </div>
        <div className="relative mt-8 flex gap-1.5">
          {items.map((item, index) => (
            <button
              key={item.q}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={item.q}
              className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-indigo" : "w-3 bg-outline"}`}
            />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
