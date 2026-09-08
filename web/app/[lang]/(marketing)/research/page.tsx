import type { Metadata } from "next";
import {
  AlertTriangle,
  AudioWaveform,
  BrainCircuit,
  Code2,
  Database,
  FileCheck2,
  Microscope,
} from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { MetricsTable } from "@/components/marketing/MetricsTable";
import { ConfusionMatrix } from "@/components/marketing/ConfusionMatrix";
import { FusionBars } from "@/components/marketing/FusionBars";
import { InView } from "@/components/marketing/InView";
import { TEXT_MODEL, AUDIO_MODEL, EMOTION_CLASSES, type EmotionClass } from "@/lib/metrics";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.nav.research, description: t.research.subheading };
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function ResearchPage({ params }: { params: Promise<{ lang: string }> }) {
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
  const classLabels = Object.fromEntries(EMOTION_CLASSES.map((emotion, index) => [emotion, t.home.hood.classes[index]])) as Record<EmotionClass, string>;

  return (
    <>
      {/* Background bleeds 8rem above the section so it passes behind the
          floating nav with no seam — same trick the aurora heroes use. */}
      <section className="relative isolate">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-32 bottom-0 -z-10 bg-[#f5f1e8]">
          <div className="absolute inset-0 opacity-[0.18] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_27px,rgba(46,42,58,0.12)_28px)]" />
        </div>
        <div aria-hidden="true" className="absolute left-5 top-5 h-8 w-8 border-l border-t border-ink/30" />
        <div aria-hidden="true" className="absolute right-5 top-5 h-8 w-8 border-r border-t border-ink/30" />
        <div aria-hidden="true" className="absolute bottom-5 left-5 h-8 w-8 border-b border-l border-ink/30" />
        <div aria-hidden="true" className="absolute bottom-5 right-5 h-8 w-8 border-b border-r border-ink/30" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-6 pb-10 pt-12 sm:gap-16 sm:pb-14 sm:pt-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-coral-deep">{r.eyebrow}</span>
              <h1 className="mt-5 max-w-5xl text-6xl font-black leading-[0.9] tracking-[-0.06em] text-ink text-balance sm:text-8xl">{r.heading}</h1>
            </div>
            <div className="border-l-2 border-ink pl-6">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-faint">{r.abstractLabel}</span>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">{r.subheading}</p>
            </div>
          </div>

          <div>
            <div className="grid border-y-2 border-ink sm:grid-cols-3 sm:divide-x-2 sm:divide-ink">
              <HeroMetric value={pct(TEXT_MODEL.accuracy)} label={r.accuracyLabel} detail={`${TEXT_MODEL.name} · ${TEXT_MODEL.dataset}`} />
              <HeroMetric value={pct(AUDIO_MODEL.meanAccuracy)} label={`${r.accuracyLabel} · 6-fold CV`} detail={`${AUDIO_MODEL.name} · ${AUDIO_MODEL.dataset}`} />
              <HeroMetric value={TEXT_MODEL.testSamples.toLocaleString()} label={r.tableSupport} detail={t.home.stats[2].detail} />
            </div>
            <div className="grid gap-5 border-b border-ink/20 py-5 sm:grid-cols-[120px_1fr]">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo">{r.taskHeading}</span>
              <p className="max-w-5xl text-sm leading-relaxed text-ink-soft">{r.taskBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#dfe7ef]">
        <div className="mx-auto w-full max-w-[1500px] px-6 py-16 sm:py-24">
          <div className="grid gap-px overflow-hidden border border-[#9aa9b7] bg-[#9aa9b7] lg:grid-cols-2">
            <article className="bg-[#f8fafb] p-6 sm:p-8">
              <header className="flex items-start justify-between gap-5 border-b-2 border-indigo pb-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-indigo">{r.figureLabel} 01 · {TEXT_MODEL.name}</span>
                  <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">{r.textHeading}</h2>
                </div>
                <BrainCircuit size={28} className="shrink-0 text-indigo" />
              </header>
              <p className="mt-6 text-sm leading-relaxed text-ink-soft">{r.textBody}</p>
              <div className="my-6 grid grid-cols-2 gap-px bg-outline sm:grid-cols-4">
                <LabMetric value={pct(TEXT_MODEL.accuracy)} label={r.accuracyLabel} />
                <LabMetric value={TEXT_MODEL.macroF1.toFixed(3)} label={r.macroF1Label} />
                <LabMetric value={TEXT_MODEL.weightedF1.toFixed(3)} label={r.weightedF1Label} />
                <LabMetric value={TEXT_MODEL.testSamples.toLocaleString()} label={r.tableSupport} />
              </div>
              <MetricsTable perClass={TEXT_MODEL.perClass} labels={tableLabels} />
            </article>

            <article className="bg-[#f8fafb] p-6 sm:p-8">
              <header className="flex items-start justify-between gap-5 border-b-2 border-sage-deep pb-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-sage-deep">{r.figureLabel} 02 · {AUDIO_MODEL.name}</span>
                  <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">{r.audioHeading}</h2>
                </div>
                <AudioWaveform size={28} className="shrink-0 text-sage-deep" />
              </header>
              <p className="mt-6 text-sm leading-relaxed text-ink-soft">{r.audioBody}</p>
              <div className="my-6 border-l-2 border-amber bg-amber-tint/60 px-4 py-3 text-xs leading-relaxed text-ink-soft">{r.audioValidationNote}</div>
              <div className="mb-6 grid grid-cols-2 gap-px bg-outline sm:grid-cols-4">
                <LabMetric value={`${pct(AUDIO_MODEL.meanAccuracy)} ± ${(AUDIO_MODEL.stdAccuracy * 100).toFixed(1)}%`} label={`${r.accuracyLabel} · 6-fold CV`} />
                <LabMetric value={`${AUDIO_MODEL.meanMacroF1.toFixed(3)} ± ${AUDIO_MODEL.stdMacroF1.toFixed(3)}`} label={`${r.macroF1Label} · 6-fold CV`} />
                <LabMetric value={pct(AUDIO_MODEL.deployedValAccuracy)} label={r.deployedLabel} />
                <LabMetric value={AUDIO_MODEL.foldAccuracies.length.toString()} label={r.foldsLabel} />
              </div>
              <ConfusionMatrix matrix={AUDIO_MODEL.aggregatedConfusion} caption={r.matrixCaption} />
            </article>
          </div>
        </div>
      </section>

      <section className="relative isolate min-h-screen overflow-hidden bg-[#181620] text-white">
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 -z-10 w-px bg-white/10" />
        <div aria-hidden="true" className="absolute right-[3%] top-[8%] -z-10 text-[13rem] font-black leading-none text-white/[0.035] sm:text-[20rem]">03</div>
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col justify-center gap-10 px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sage">{r.figureLabel} 03</span>
              <h2 className="mt-4 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.05em] text-white text-balance sm:text-7xl">{r.fusionHeading}</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/58 lg:text-right">{r.fusionBody}</p>
          </div>

          <code className="block overflow-x-auto border-y border-white/15 py-7 text-center text-sm text-[#CEC2E8] sm:text-xl">{r.fusionFormula}</code>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
            <InView className="border-t border-white/15 pt-6">
              <FusionBars tone="dark" textLabel={t.home.hood.textLabel} audioLabel={t.home.hood.audioLabel} classLabels={classLabels} />
            </InView>
            <div className="border-l-2 border-sage pl-6">
              <h3 className="text-xl font-black text-white">{r.fusionInsightHeading}</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60">{r.fusionInsightBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f1c66f] text-[#211d18]">
        <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <AlertTriangle size={34} />
            <span className="mt-6 block text-[10px] font-black uppercase tracking-[0.25em]">{r.figureLabel} 04</span>
            <h2 className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.05em] sm:text-7xl">{r.limitationsHeading}</h2>
          </div>
          <ol className="border-t-2 border-[#211d18]">
            {r.limitations.map((item, index) => (
              <li key={item} className="grid gap-4 border-b border-[#211d18]/25 py-6 sm:grid-cols-[60px_1fr]">
                <span className="text-2xl font-black text-[#211d18]/30">0{index + 1}</span>
                <p className="text-sm leading-relaxed sm:text-base">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#dcebe8]">
        <div className="mx-auto grid min-h-[55vh] w-full max-w-[1400px] gap-10 px-6 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="flex h-12 w-12 items-center justify-center border border-sage-deep/25 text-sage-deep"><Code2 size={22} /></span>
            <span className="mt-6 block text-[10px] font-black uppercase tracking-[0.25em] text-sage-deep">{r.figureLabel} 05</span>
            <h2 className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.05em] text-ink sm:text-6xl">{r.reproHeading}</h2>
          </div>
          <div className="border-l-2 border-sage-deep pl-6 sm:pl-10">
            <p className="max-w-3xl text-lg leading-relaxed text-ink-soft">{r.reproBody}</p>
            <div className="mt-8 grid gap-px bg-sage-deep/20 sm:grid-cols-3">
              <ResearchAsset icon={Microscope} label={r.reproAssets[0]} />
              <ResearchAsset icon={Database} label={r.reproAssets[1]} />
              <ResearchAsset icon={FileCheck2} label={r.reproAssets[2]} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroMetric({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div className="px-5 py-6 sm:px-7">
      <span className="block text-5xl font-black tracking-[-0.06em] text-ink sm:text-6xl">{value}</span>
      <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.16em] text-indigo">{label}</span>
      <span className="mt-2 block text-[10px] leading-relaxed text-ink-faint">{detail}</span>
    </div>
  );
}

function LabMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-3">
      <span className="block text-lg font-black tracking-tight text-ink">{value}</span>
      <span className="mt-1 block text-[9px] font-bold leading-tight text-ink-faint">{label}</span>
    </div>
  );
}

function ResearchAsset({ icon: Icon, label }: { icon: typeof Microscope; label: string }) {
  return (
    <div className="flex min-h-28 flex-col justify-between bg-[#eef6f4] p-4">
      <Icon size={20} className="text-sage-deep" />
      <span className="mt-6 text-xs font-black leading-tight text-ink">{label}</span>
    </div>
  );
}
