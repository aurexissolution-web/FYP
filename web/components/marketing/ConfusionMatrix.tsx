import { Fragment } from "react";
import { EMOTION_CLASSES } from "@/lib/metrics";

export function ConfusionMatrix({
  matrix,
  caption,
}: {
  matrix: readonly (readonly number[])[];
  caption: string;
}) {
  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));

  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div
          className="grid gap-1.5 min-w-[420px]"
          style={{ gridTemplateColumns: `88px repeat(4, 1fr)` }}
        >
          <div />
          {EMOTION_CLASSES.map((c) => (
            <div
              key={c}
              className="text-center text-xs font-bold text-ink-soft capitalize pb-1"
            >
              {c}
            </div>
          ))}
          {EMOTION_CLASSES.map((rowLabel, r) => (
            <Fragment key={rowLabel}>
              <div className="flex items-center text-xs font-bold text-ink-soft capitalize">
                {rowLabel}
              </div>
              {matrix[r].map((count, c) => {
                const pct = count / rowTotals[r];
                const isDiag = r === c;
                return (
                  <div
                    key={`${r}-${c}`}
                    className="flex h-14 items-center justify-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: isDiag
                        ? `rgba(107, 91, 138, ${0.15 + pct * 0.75})`
                        : `rgba(107, 91, 138, ${pct * 0.35})`,
                      color: pct > 0.5 ? "white" : "var(--color-ink)",
                    }}
                  >
                    {count}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <figcaption className="text-xs text-ink-faint">{caption}</figcaption>
    </figure>
  );
}
