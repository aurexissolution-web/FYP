import { Fragment } from "react";
import { AudioLines, BrainCircuit, Heart, ChevronRight } from "lucide-react";

const STEPS = [
  { Icon: AudioLines, ring: "bg-indigo-tint", tint: "text-blue" },
  { Icon: BrainCircuit, ring: "bg-sage-tint", tint: "text-sage-deep" },
  { Icon: Heart, ring: "bg-coral-tint", tint: "text-coral-deep" },
];

export function HeroFlow({ labels }: { labels: [string, string, string] }) {
  return (
    <div className="flex w-fit flex-wrap items-center gap-3 rounded-3xl bg-cream-alt px-5 py-4 sm:gap-4">
      {labels.map((label, i) => {
        const { Icon, ring, tint } = STEPS[i];
        return (
          <Fragment key={label}>
            {i > 0 && (
              <ChevronRight
                size={16}
                className="shrink-0 text-ink-faint/60"
                aria-hidden
              />
            )}
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ring} ${tint}`}
              >
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="max-w-[7rem] text-sm font-bold leading-tight text-ink">
                {label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
