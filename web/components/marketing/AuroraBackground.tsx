/*
  Aurora gradient background.

  The light variants use the supplied hues, positions and ellipse sizes
  verbatim. `intensity` scales every layer's alpha at once so brightness can be
  tuned from one number (1 = the original snippet, 0.45 = the calm default —
  this site is presented on a projector, where a hot background washes out the
  ink body copy on top of it).

  Each layer is its own element so it can drift independently; the drift is
  transform-only and disabled under Reduce Motion (see globals.css). Layers
  are oversized (`inset-[-8%]`) so a few percent of translation never exposes
  an edge.

  The default position bleeds above its own box (`-top-32`) so the hero's
  gradient passes behind the floating nav pill without a seam. Other sections
  pass `className="absolute inset-0"`.
*/

type Layer = { shape: string; rgb: string; alpha: number; fade: string };
type Tone = "light" | "dark";

const LIGHT_VARIANTS: Record<string, Layer[]> = {
  "soft-harmony": [
    { shape: "ellipse 80% 60% at 60% 20%", rgb: "175, 109, 255", alpha: 0.5, fade: "65%" },
    { shape: "ellipse 70% 60% at 20% 80%", rgb: "255, 100, 180", alpha: 0.45, fade: "65%" },
    { shape: "ellipse 60% 50% at 60% 65%", rgb: "255, 235, 170", alpha: 0.43, fade: "62%" },
    { shape: "ellipse 65% 40% at 50% 60%", rgb: "120, 190, 255", alpha: 0.48, fade: "68%" },
  ],
  "corner-whispers": [
    { shape: "ellipse 85% 65% at 8% 8%", rgb: "175, 109, 255", alpha: 0.42, fade: "60%" },
    { shape: "ellipse 75% 60% at 75% 35%", rgb: "255, 235, 170", alpha: 0.55, fade: "62%" },
    { shape: "ellipse 70% 60% at 15% 80%", rgb: "255, 100, 180", alpha: 0.4, fade: "62%" },
    { shape: "ellipse 70% 60% at 92% 92%", rgb: "120, 190, 255", alpha: 0.45, fade: "62%" },
  ],
};

// Brand hues at low alpha for use over `bg-ink`. Indigo and sage dominate,
// with a faint amber and blue so the dark sections don't read as flat.
const DARK_LAYERS: Layer[] = [
  { shape: "ellipse 70% 55% at 18% 30%", rgb: "107, 91, 138", alpha: 0.9, fade: "65%" },
  { shape: "ellipse 60% 50% at 82% 72%", rgb: "127, 185, 180", alpha: 0.45, fade: "62%" },
  { shape: "ellipse 55% 45% at 68% 12%", rgb: "224, 164, 88", alpha: 0.22, fade: "60%" },
  { shape: "ellipse 60% 50% at 30% 88%", rgb: "107, 146, 201", alpha: 0.4, fade: "62%" },
];

const LIGHT_BASE = "linear-gradient(180deg, #FBF7FE 0%, #FEF6F8 100%)";

// Literal class names so Tailwind's scanner sees them.
const DRIFT = ["aurora-layer-1", "aurora-layer-2", "aurora-layer-3", "aurora-layer-4"];

export function AuroraBackground({
  variant = "soft-harmony",
  intensity = 0.45,
  tone = "light",
  animate = true,
  className = "absolute inset-x-0 -top-32 bottom-0",
}: {
  variant?: keyof typeof LIGHT_VARIANTS;
  intensity?: number;
  tone?: Tone;
  animate?: boolean;
  className?: string;
}) {
  const layers = tone === "dark" ? DARK_LAYERS : LIGHT_VARIANTS[variant];

  return (
    <div
      aria-hidden
      className={`pointer-events-none z-0 overflow-hidden ${className}`}
      style={{ background: tone === "dark" ? undefined : LIGHT_BASE }}
    >
      {layers.map((l, i) => (
        <div
          key={i}
          className={`absolute inset-[-8%] ${animate ? DRIFT[i] : ""}`}
          style={{
            background: `radial-gradient(${l.shape}, rgba(${l.rgb}, ${(l.alpha * intensity).toFixed(3)}), transparent ${l.fade})`,
          }}
        />
      ))}
    </div>
  );
}
