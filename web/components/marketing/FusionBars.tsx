import { FUSION_WEIGHTS, EMOTION_CLASSES, type EmotionClass } from "@/lib/metrics";

/*
  One bar per emotion showing how the final decision is split between the
  text model and the audio model. Widths come straight from FUSION_WEIGHTS
  (computed from each model's measured per-class F1), so this chart cannot
  disagree with the deployed fusion.

  Inside an <InView> the `.grow-x` bars grow from zero with a small stagger.
*/
export function FusionBars({
  tone = "light",
  textLabel,
  audioLabel,
  classLabels,
}: {
  tone?: "light" | "dark";
  textLabel: string;
  audioLabel: string;
  classLabels?: Partial<Record<EmotionClass, string>>;
}) {
  const dark = tone === "dark";
  const textFill = dark ? "bg-[#CEC2E8]" : "bg-indigo";
  const audioFill = dark ? "bg-[#9AD8D2]" : "bg-sage-deep";

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-4">
        {EMOTION_CLASSES.map((c, i) => {
          const w = FUSION_WEIGHTS[c];
          return (
            <li key={c} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className={`font-bold capitalize ${dark ? "text-white" : "text-ink"}`}>
                  {classLabels?.[c] ?? c}
                </span>
                <span
                  className={`text-xs tabular-nums ${dark ? "text-white/55" : "text-ink-faint"}`}
                >
                  {textLabel} {(w.text * 100).toFixed(1)}% · {audioLabel}{" "}
                  {(w.audio * 100).toFixed(1)}%
                </span>
              </div>
              <div
                className={`grow-x flex h-2.5 w-full overflow-hidden rounded-full ${
                  dark ? "bg-white/10" : "bg-cream-alt"
                }`}
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <div className={`h-full ${textFill}`} style={{ width: `${w.text * 100}%` }} />
                <div className={`h-full ${audioFill}`} style={{ width: `${w.audio * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div
        className={`flex items-center gap-5 text-xs ${dark ? "text-white/55" : "text-ink-faint"}`}
      >
        <span className="inline-flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${textFill}`} />
          {textLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${audioFill}`} />
          {audioLabel}
        </span>
      </div>
    </div>
  );
}
