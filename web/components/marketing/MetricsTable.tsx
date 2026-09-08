import { EMOTION_CLASSES, type ClassMetric, type EmotionClass } from "@/lib/metrics";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function MetricsTable({
  perClass,
  labels,
}: {
  perClass: Record<EmotionClass, ClassMetric>;
  labels: {
    class: string;
    precision: string;
    recall: string;
    f1: string;
    support: string;
  };
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-outline/70">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-outline/70 bg-cream-alt text-left">
            <th className="px-4 py-3 font-bold text-ink-soft">{labels.class}</th>
            <th className="px-4 py-3 font-bold text-ink-soft">{labels.precision}</th>
            <th className="px-4 py-3 font-bold text-ink-soft">{labels.recall}</th>
            <th className="px-4 py-3 font-bold text-ink-soft">{labels.f1}</th>
            <th className="px-4 py-3 font-bold text-ink-soft">{labels.support}</th>
          </tr>
        </thead>
        <tbody>
          {EMOTION_CLASSES.map((c: EmotionClass) => (
            <tr key={c} className="border-b border-outline/40 last:border-0">
              <td className="px-4 py-3 font-semibold text-ink capitalize">{c}</td>
              <td className="px-4 py-3 text-ink-soft">{pct(perClass[c].precision)}</td>
              <td className="px-4 py-3 text-ink-soft">{pct(perClass[c].recall)}</td>
              <td className="px-4 py-3 font-bold text-indigo">{pct(perClass[c].f1)}</td>
              <td className="px-4 py-3 text-ink-faint">{perClass[c].support}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
