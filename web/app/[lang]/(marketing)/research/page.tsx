import type { Metadata } from "next";
import { AlertTriangle, Code2 } from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Container";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { MetricsTable } from "@/components/marketing/MetricsTable";
import { ConfusionMatrix } from "@/components/marketing/ConfusionMatrix";
import { FusionBars } from "@/components/marketing/FusionBars";
import { TEXT_MODEL, AUDIO_MODEL } from "@/lib/metrics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.nav.research, description: t.research.subheading };
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const r = t.research;
  const tableLabels = {
    class: r.tableClass,
    precision: r.tablePrecision,
    recall: r.tableRecall,
    f1: r.tableF1,
    support: r.tableSupport,
  };

  return (
    <Container className="py-16 sm:py-20 flex flex-col gap-16 max-w-4xl">
      <SectionHeading eyebrow={r.eyebrow} heading={r.heading} subheading={r.subheading} />

      {/* Task framing */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-ink">{r.taskHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{r.taskBody}</p>
      </section>

      {/* Text model */}
      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-extrabold text-ink">{r.textHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{r.textBody}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat value={pct(TEXT_MODEL.accuracy)} label="Accuracy" />
          <MiniStat value={TEXT_MODEL.macroF1.toFixed(3)} label="Macro F1" />
          <MiniStat value={TEXT_MODEL.weightedF1.toFixed(3)} label="Weighted F1" />
          <MiniStat value={TEXT_MODEL.testSamples.toLocaleString()} label={r.tableSupport} />
        </div>
        <MetricsTable perClass={TEXT_MODEL.perClass} labels={tableLabels} />
      </section>

      {/* Audio model */}
      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-extrabold text-ink">{r.audioHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{r.audioBody}</p>
        <p className="text-sm text-ink-soft leading-relaxed rounded-xl bg-cream-alt p-4">
          {r.audioValidationNote}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat
            value={`${pct(AUDIO_MODEL.meanAccuracy)} ± ${(AUDIO_MODEL.stdAccuracy * 100).toFixed(1)}%`}
            label="Accuracy (6-fold CV)"
          />
          <MiniStat
            value={`${AUDIO_MODEL.meanMacroF1.toFixed(3)} ± ${AUDIO_MODEL.stdMacroF1.toFixed(3)}`}
            label="Macro F1 (6-fold CV)"
          />
          <MiniStat
            value={pct(AUDIO_MODEL.deployedValAccuracy)}
            label="Deployed checkpoint val. acc."
          />
          <MiniStat
            value={AUDIO_MODEL.foldAccuracies.length.toString()}
            label="Folds, actor-disjoint"
          />
        </div>
        <ConfusionMatrix
          matrix={AUDIO_MODEL.aggregatedConfusion}
          caption="Aggregated confusion matrix across all 6 folds. Rows = true label, columns = predicted label."
        />
      </section>

      {/* Fusion */}
      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-extrabold text-ink">{r.fusionHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{r.fusionBody}</p>
        <code className="block rounded-xl bg-ink px-5 py-4 text-sm text-cream overflow-x-auto">
          {r.fusionFormula}
        </code>
        <div className="rounded-xl border border-outline/70 bg-surface p-5">
          <FusionBars textLabel="text" audioLabel="audio" />
        </div>
        <div className="rounded-xl bg-indigo-tint p-5">
          <h3 className="text-sm font-extrabold text-indigo-deep mb-1.5">
            {r.fusionInsightHeading}
          </h3>
          <p className="text-sm text-ink leading-relaxed">{r.fusionInsightBody}</p>
        </div>
      </section>

      {/* Limitations */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={20} className="text-amber" />
          <h2 className="text-xl font-extrabold text-ink">{r.limitationsHeading}</h2>
        </div>
        <ul className="flex flex-col gap-3">
          {r.limitations.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-sm text-ink-soft leading-relaxed rounded-xl border border-outline/70 bg-surface p-4"
            >
              <span className="text-amber mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Reproducibility */}
      <section className="flex flex-col gap-3 rounded-2xl border border-outline/70 bg-cream-alt p-6">
        <div className="flex items-center gap-2.5">
          <Code2 size={20} className="text-ink-soft" />
          <h2 className="text-lg font-extrabold text-ink">{r.reproHeading}</h2>
        </div>
        <p className="text-sm text-ink-soft leading-relaxed">{r.reproBody}</p>
      </section>
    </Container>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-outline/70 bg-surface p-4">
      <div className="text-xl font-extrabold text-indigo">{value}</div>
      <div className="text-xs text-ink-faint mt-1 leading-snug">{label}</div>
    </div>
  );
}
