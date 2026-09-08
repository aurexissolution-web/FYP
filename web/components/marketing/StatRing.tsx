import type { ReactNode } from "react";

/*
  Radial progress ring for the accuracy stats. `percent` comes from
  lib/metrics.ts (the real training-run numbers), not from the copy deck, so
  the ring can never drift away from the figure printed inside it.

  The arc is a dash the length of the full circumference, offset so only the
  `percent` portion shows. Inside an <InView> the `.ring-draw` rules in
  globals.css animate that offset from "nothing" to the final value; without
  JS or with Reduce Motion the static offset below is what renders.
*/
export function StatRing({
  percent,
  ariaLabel,
  color,
  size = 148,
  stroke = 10,
  children,
}: {
  percent: number; // 0–1
  ariaLabel: string;
  color: string;
  size?: number;
  stroke?: number;
  children: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const end = circumference * (1 - percent);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          className="ring-draw"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={end}
          style={
            {
              "--ring-circ": circumference,
              "--ring-end": end,
            } as React.CSSProperties
          }
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[28px] font-extrabold tracking-tight text-white tabular-nums">
        {children}
      </span>
    </div>
  );
}
