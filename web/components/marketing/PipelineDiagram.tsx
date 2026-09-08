import type { Dictionary } from "@/lib/dictionaries";

/*
  The inference pipeline as an SVG flow, for a dark background. Connectors are
  dashed and the `.dash-flow` utility slides the dashes along them (disabled
  under Reduce Motion). Layout is in a fixed viewBox so it scales as one piece;
  the parent provides horizontal scrolling for very narrow screens.
*/
type Labels = Dictionary["home"]["hood"]["nodes"];

const LAVENDER = "#CEC2E8";
const MINT = "#9AD8D2";
const AMBER = "#E0A458";
const CORAL = "#E08C7E";
const LINE = "rgba(255,255,255,0.45)";

function Node({
  x,
  y,
  w,
  label,
  sub,
  stroke = "rgba(255,255,255,0.28)",
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  sub?: string;
  stroke?: string;
}) {
  const h = 46;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={12}
        fill="rgba(255,255,255,0.05)"
        stroke={stroke}
        strokeWidth={1.5}
      />
      <text
        x={x + w / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={15}
        fontWeight={700}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h + 18}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize={11.5}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Flow({ d, stroke = LINE }: { d: string; stroke?: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeDasharray="6 6"
      className="dash-flow"
      markerEnd="url(#pipeline-arrow)"
    />
  );
}

export function PipelineDiagram({ labels }: { labels: Labels }) {
  return (
    <svg
      viewBox="0 0 1080 250"
      className="h-auto w-full min-w-[720px]"
      role="img"
      aria-label={`${labels.text} / ${labels.voice} → ${labels.crisis} → ${labels.textModel} / ${labels.audioModel} → ${labels.fusion} → ${labels.emotion} → ${labels.output}`}
    >
      <defs>
        <marker
          id="pipeline-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="rgba(255,255,255,0.7)" />
        </marker>
      </defs>

      {/* Connectors (drawn first so nodes sit on top) */}
      <Flow d="M150 53 H196" />
      <Flow d="M350 53 H396" />
      <Flow d="M150 193 H396" />
      <Flow d="M520 53 C 548 53, 542 123, 566 123" />
      <Flow d="M520 193 C 548 193, 542 123, 566 123" />
      <Flow d="M740 123 H786" />
      <Flow d="M880 123 H926" />
      {/* Crisis branch — the hard override */}
      <Flow d="M275 30 V 18" stroke={CORAL} />
      <text
        x={275}
        y={11}
        textAnchor="middle"
        fill={CORAL}
        fontSize={12}
        fontWeight={700}
      >
        {labels.hotlines}
      </text>

      {/* Inputs */}
      <Node x={20} y={30} w={130} label={labels.text} />
      <Node x={20} y={170} w={130} label={labels.voice} />

      {/* Gate */}
      <Node x={200} y={30} w={150} label={labels.crisis} sub={labels.crisisSub} stroke={CORAL} />

      {/* Models */}
      <Node x={400} y={30} w={120} label={labels.textModel} sub="GoEmotions" stroke={LAVENDER} />
      <Node x={400} y={170} w={120} label={labels.audioModel} sub="RAVDESS" stroke={MINT} />

      {/* Fusion → emotion → output */}
      <Node x={570} y={100} w={170} label={labels.fusion} sub={labels.fusionSub} stroke={AMBER} />
      <Node x={790} y={100} w={90} label={labels.emotion} />
      <Node x={930} y={100} w={130} label={labels.output} stroke={MINT} />
    </svg>
  );
}
