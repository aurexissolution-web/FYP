import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  body,
  tint = "indigo",
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tint?: "indigo" | "sage" | "coral" | "amber" | "blue";
}) {
  const tintClass: Record<string, string> = {
    indigo: "bg-indigo-tint text-indigo",
    sage: "bg-sage-tint text-sage-deep",
    coral: "bg-coral-tint text-coral-deep",
    amber: "bg-amber-tint text-amber",
    blue: "bg-indigo-tint text-blue",
  };

  return (
    <div className="rounded-2xl border border-outline/70 bg-surface p-6 flex flex-col gap-4">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tintClass[tint]}`}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
