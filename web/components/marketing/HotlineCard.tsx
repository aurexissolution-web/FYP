import { Phone } from "lucide-react";
import type { HotlineEntry } from "@/lib/hotlines";

/* One verified hotline, from lib/hotlines.ts (the site's single source). */
export function HotlineCard({
  hotline,
  callLabel,
}: {
  hotline: HotlineEntry;
  callLabel: string;
}) {
  return (
    <li className="reveal group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-coral/20 bg-white/85 p-5 shadow-[0_20px_55px_-32px_rgba(184,95,79,0.4)] backdrop-blur-md transition-[transform,box-shadow] hover:[transform:translateY(-4px)] hover:shadow-[0_28px_60px_-28px_rgba(184,95,79,0.42)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-coral via-amber to-coral-deep" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-coral-deep">
          {hotline.name}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-tint text-coral-deep transition-colors group-hover:bg-coral-deep group-hover:text-white">
          <Phone size={15} aria-hidden="true" />
        </span>
      </div>
      <a
        href={hotline.telHref}
        className="text-3xl font-extrabold tracking-tight text-ink tabular-nums transition-colors hover:text-coral-deep"
      >
        {hotline.phone}
      </a>
      <p className="text-xs leading-relaxed text-ink-soft">{hotline.description}</p>
      <a
        href={hotline.telHref}
        className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-coral-deep px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-coral"
      >
        <Phone size={13} aria-hidden="true" />
        {callLabel} {hotline.phone}
      </a>
    </li>
  );
}
