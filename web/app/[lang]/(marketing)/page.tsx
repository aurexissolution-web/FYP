import Link from "next/link";
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CircleCheck,
  X,
  GraduationCap,
  MessagesSquare,
  Languages,
  CircleDollarSign,
  ArrowDown,
  Smartphone,
  BrainCircuit,
  Server,
  Globe2,
  Award,
} from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { getHotlines } from "@/lib/hotlines";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Container";
import { StatRing } from "@/components/marketing/StatRing";
import { CountUp } from "@/components/marketing/CountUp";
import { InView } from "@/components/marketing/InView";
import { Timeline } from "@/components/marketing/Timeline";
import { FusionBars } from "@/components/marketing/FusionBars";
import { PipelineDiagram } from "@/components/marketing/PipelineDiagram";
import { LiveDemo } from "@/components/marketing/LiveDemo";
import { FeatureBento } from "@/components/marketing/FeatureBento";
import { HotlineCard } from "@/components/marketing/HotlineCard";
import { Faq } from "@/components/marketing/Faq";
import {
  TEXT_MODEL,
  AUDIO_MODEL,
  EMOTION_CLASSES,
  type EmotionClass,
} from "@/lib/metrics";
import { PhoneMockup } from "@/components/marketing/PhoneMockup";
import { HeroFlow } from "@/components/marketing/HeroFlow";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import HolographicBeams from "@/components/ui/beams-background";

// NHMS 2023: 4.6% of Malaysians aged 16+ — reported as "about one million".
const DEPRESSION_HEADCOUNT = 1_000_000;

// Official UN SDG colours.
const SDG_COLOURS = { 3: "#4C9F38", 10: "#DD1367" } as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const h = t.home;
  const hotlines = getHotlines(lang);

  const proofStrip = [
    { value: TEXT_MODEL.macroF1.toFixed(2), label: h.proofStrip[0] },
    { value: `${AUDIO_MODEL.foldAccuracies.length}-fold`, label: h.proofStrip[1] },
    { value: String(EMOTION_CLASSES.length), label: h.proofStrip[2] },
  ];
  const classLabels = Object.fromEntries(
    EMOTION_CLASSES.map((c, i) => [c, h.hood.classes[i]]),
  ) as Record<EmotionClass, string>;
  const sdgs = [
    { n: 3, colour: SDG_COLOURS[3], text: t.about.sdg3 },
    { n: 10, colour: SDG_COLOURS[10], text: t.about.sdg10 },
  ];
  const barrierIcons = [MessagesSquare, Languages, CircleDollarSign];
  const buildIcons = [Smartphone, BrainCircuit, Server, Globe2];

  return (
    <>
      {/* 0 · Hero — the aurora layer extends up behind the floating nav pill,
          so there is no seam where the nav strip meets the hero. */}
      <section className="relative isolate">
        <AuroraBackground />
        <Container className="relative z-10 grid gap-12 pb-16 pt-12 sm:pb-24 sm:pt-16 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo">
              {h.badge}
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink text-balance leading-[1.08]">
              {h.title}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
              {h.subtitle}
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sage-tint px-4 py-2 text-sm font-bold text-sage-deep">
                {h.pills[0]}
              </span>
              <span className="rounded-full bg-indigo-tint px-4 py-2 text-sm font-bold text-indigo">
                {h.pills[1]}
              </span>
              <span className="rounded-full bg-coral-tint px-4 py-2 text-sm font-bold text-coral-deep">
                {h.pills[2]}
              </span>
            </div>

            <HeroFlow labels={h.flow} />

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={`/${lang}/signup`}
                className="inline-flex items-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-deep"
              >
                {h.ctaPrimary}
                <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${lang}/how-it-works`}
                className="inline-flex items-center gap-2 rounded-full border border-outline px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-cream-alt"
              >
                {h.ctaSecondary}
              </Link>
            </div>
            <p className="pt-1 text-xs text-ink-faint">{h.trustLine}</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PhoneMockup phone={h.phone} langChip={lang === "ms" ? "BM" : "EN"} />
          </div>
        </Container>
      </section>

      {/* 1 · Proof band — the dark "results" section, straight after the hero
          because it's what a judge reads hardest. Rings draw and numbers count
          up when it scrolls into view; a dark aurora drifts behind. */}
      <section className="relative isolate overflow-hidden bg-ink">
        <AuroraBackground tone="dark" intensity={0.55} className="absolute inset-0" />
        <div
          aria-hidden="true"
          className="dot-grid absolute inset-0 z-0 opacity-[0.14] [mask-image:radial-gradient(ellipse_70%_75%_at_50%_50%,black_10%,transparent_100%)]"
        />
        <InView className="relative z-10">
          <Container className="flex flex-col items-center gap-12 py-20 sm:py-24">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-sage">
                {h.statsEyebrow}
              </span>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl">
                {h.statsHeading}
              </h2>
            </div>

            <div className="grid w-full grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
              {/* Text model — ring driven by the real held-out accuracy */}
              <div className="flex flex-col items-center gap-4 text-center">
                <StatRing
                  percent={TEXT_MODEL.accuracy}
                  ariaLabel={h.stats[0].value}
                  color="#CEC2E8"
                >
                  <CountUp value={TEXT_MODEL.accuracy} format="percent0" />
                </StatRing>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white">{h.stats[0].label}</span>
                  <span className="text-sm leading-snug text-white/45">
                    {h.stats[0].detail}
                  </span>
                </div>
              </div>

              {/* Audio model — ring driven by the real 6-fold CV mean */}
              <div className="flex flex-col items-center gap-4 text-center">
                <StatRing
                  percent={AUDIO_MODEL.meanAccuracy}
                  ariaLabel={h.stats[1].value}
                  color="#9AD8D2"
                >
                  <CountUp value={AUDIO_MODEL.meanAccuracy} format="percent1" />
                </StatRing>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white">{h.stats[1].label}</span>
                  <span className="text-sm leading-snug text-white/45">
                    {h.stats[1].detail}
                  </span>
                </div>
              </div>

              {/* Sample count — a magnitude, not a rate. Same medallion
                  silhouette, but a dotted complete ring: nothing here is
                  being measured against 100%. */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative flex h-[148px] w-[148px] items-center justify-center">
                  <svg
                    width={148}
                    height={148}
                    className="absolute inset-0"
                    aria-hidden="true"
                  >
                    <circle
                      cx={74}
                      cy={74}
                      r={69}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth={10}
                      strokeLinecap="round"
                      strokeDasharray="2 14"
                    />
                  </svg>
                  <CountUp
                    value={TEXT_MODEL.testSamples}
                    format="integer"
                    className="relative text-[34px] font-extrabold tracking-tight text-amber tabular-nums"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white">{h.stats[2].label}</span>
                  <span className="text-sm leading-snug text-white/45">
                    {h.stats[2].detail}
                  </span>
                </div>
              </div>
            </div>

            {/* Fact strip — every value comes from lib/metrics.ts */}
            <div className="flex flex-wrap justify-center gap-y-4 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4 sm:divide-x sm:divide-white/10">
              {proofStrip.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-0.5 px-7 text-center"
                >
                  <span className="text-xl font-extrabold text-white tabular-nums">
                    {s.value}
                  </span>
                  <span className="text-xs text-white/50">{s.label}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/${lang}/research`}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-white/50 hover:bg-white/5"
            >
              {h.statsLink}
              <ArrowRight size={15} />
            </Link>
          </Container>
        </InView>
      </section>

      {/* 2 · Problem — one dominant figure, counting up, on a soft glow. */}
      <section className="relative isolate min-h-screen overflow-hidden border-y border-white/10 bg-indigo-deep text-white">
        <div aria-hidden="true" className="dot-grid absolute inset-0 -z-20 opacity-[0.08] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
        <div aria-hidden="true" className="absolute -left-48 top-1/4 -z-10 h-[36rem] w-[36rem] rounded-full bg-sage/20 blur-[120px]" />
        <div aria-hidden="true" className="absolute -right-48 bottom-0 -z-10 h-[40rem] w-[40rem] rounded-full bg-coral/15 blur-[130px]" />
        <Container className="flex min-h-screen flex-col justify-center gap-7 py-12 sm:py-14 lg:gap-5 lg:py-10">
          <div className="grid items-end gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col items-start gap-3">
              <span className="rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage">
                {h.problemEyebrow}
              </span>
              <h2 className="max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight text-balance sm:text-5xl lg:text-5xl">
                {h.problemHeading}
              </h2>
            </div>
            <p className="max-w-2xl border-l-2 border-coral pl-5 text-sm leading-relaxed text-white/65 sm:text-base lg:justify-self-end">
              {h.problemBody}
            </p>
          </div>

          <InView className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-[0_30px_90px_rgba(20,16,30,0.32)] backdrop-blur-sm">
            <div aria-hidden="true" className="absolute -right-24 -top-44 h-96 w-96 rounded-full border-[70px] border-white/[0.035]" />
            <div className="grid lg:grid-cols-[1.4fr_0.6fr]">
              <div className="relative p-7 sm:p-8 lg:p-7">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sage">
                  {h.problemBig.label}
                </span>
                <CountUp
                  value={DEPRESSION_HEADCOUNT}
                  format="integer"
                  duration={2400}
                  className="mt-3 block text-6xl font-extrabold leading-none tracking-[-0.06em] text-white tabular-nums sm:text-7xl lg:text-[6.5rem]"
                />
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-1.5 w-28 rounded-full bg-gradient-to-r from-sage via-amber to-coral" />
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">4.6%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-white/10 bg-black/10 lg:grid-cols-1 lg:border-l lg:border-t-0">
                {h.problemStats.map((s, index) => (
                  <div key={s.detail} className="reveal flex flex-col justify-center p-5 first:border-r first:border-white/10 sm:p-6 lg:first:border-b lg:first:border-r-0">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{s.value}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-coral" : "bg-amber"}`} />
                    </div>
                    <span className="text-xs leading-snug text-white/60">{s.label}</span>
                    <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-sage">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </InView>

          <div>
            <div className="mb-3 flex items-center gap-4">
              <h3 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{h.problemBarriersHeading}</h3>
              <div className="hidden h-px flex-1 bg-white/10 sm:block" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {h.problemBarriers.map((barrier, index) => {
                const Icon = barrierIcons[index];
                return (
                  <div key={barrier.title} className="reveal group rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition-colors hover:bg-white/[0.09]">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sage transition-transform group-hover:-translate-y-1">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <h4 className="mb-1 text-sm font-bold text-white">{barrier.title}</h4>
                    <p className="text-xs leading-snug text-white/55">{barrier.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid items-center gap-4 rounded-2xl border border-sage/25 bg-gradient-to-r from-sage/15 to-white/[0.04] p-5 lg:grid-cols-[auto_1fr_1.15fr]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-indigo-deep">
              <ArrowDown size={18} aria-hidden="true" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-sage">{h.problemBridge.eyebrow}</span>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight text-white">{h.problemBridge.heading}</h3>
            </div>
            <p className="text-xs leading-relaxed text-white/60 lg:border-l lg:border-white/10 lg:pl-6">{h.problemBridge.body}</p>
          </div>

          <p className="text-center text-[10px] leading-relaxed text-white/30">{h.problemBig.source}</p>
        </Container>
      </section>

      {/* 3 · How it works — the five real pipeline steps as a timeline. Copy is
          howItWorks.* verbatim, so the home page and the subpage can't drift. */}
      <section className="relative isolate min-h-screen overflow-hidden bg-cream-alt">
        <AuroraBackground variant="corner-whispers" intensity={0.62} className="absolute inset-0" />
        <div aria-hidden="true" className="dot-grid absolute inset-0 z-[1] opacity-35 [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 z-[1] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo/10 shadow-[0_0_0_80px_rgba(107,91,138,0.035),0_0_0_160px_rgba(127,185,180,0.025)]" />
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full opacity-55" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="journey-flow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7fb9b4" stopOpacity="0" />
              <stop offset="35%" stopColor="#6b5b8a" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#e08c7e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#e0a458" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-80 180 C260 40 390 330 720 190 S1160 80 1520 240" fill="none" stroke="url(#journey-flow)" strokeWidth="1.5" />
          <path className="dash-flow" d="M-80 180 C260 40 390 330 720 190 S1160 80 1520 240" fill="none" stroke="url(#journey-flow)" strokeWidth="3" strokeDasharray="5 19" />
          <path d="M-100 700 C250 520 470 820 790 650 S1190 510 1530 720" fill="none" stroke="url(#journey-flow)" strokeWidth="1.5" />
          <path className="dash-flow" d="M-100 700 C250 520 470 820 790 650 S1190 510 1530 720" fill="none" stroke="url(#journey-flow)" strokeWidth="3" strokeDasharray="5 19" />
          <circle cx="180" cy="150" r="5" fill="#7fb9b4" fillOpacity="0.55" />
          <circle cx="1260" cy="720" r="6" fill="#e08c7e" fillOpacity="0.45" />
        </svg>
        <Container className="relative z-10 flex min-h-screen flex-col justify-center gap-8 py-12 sm:py-14">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sage-deep">
                {t.howItWorks.eyebrow}
              </span>
              <h2 className="max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight text-ink text-balance sm:text-5xl">
                {t.howItWorks.heading}
              </h2>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <p className="max-w-lg text-sm leading-relaxed text-ink-soft lg:text-right sm:text-base">
                {t.howItWorks.subheading}
              </p>
              <Link
                href={`/${lang}/how-it-works`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo hover:underline"
              >
                {h.stepsLink}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <InView threshold={0.2}>
            <Timeline steps={t.howItWorks.steps} overrideChip={h.stepsOverrideChip} />
          </InView>

          <div className="reveal grid items-center gap-4 rounded-2xl border border-coral/35 bg-coral-tint/65 p-5 sm:grid-cols-[auto_1fr]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-deep text-white">
              <ShieldAlert size={19} aria-hidden="true" />
            </div>
            <p className="text-sm leading-relaxed text-ink">{t.howItWorks.crisisNote}</p>
          </div>
        </Container>
      </section>

      {/* 4 · Live demo — an auto-playing check-in, alternating EN and BM. */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,#eee9f5_0%,#faf8fc_42%,#fff4ef_100%)]" />
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 z-[1] w-px bg-gradient-to-b from-transparent via-indigo/10 to-transparent" />
        <div aria-hidden="true" className="absolute -left-24 top-20 z-[1] h-72 w-72 rounded-full bg-indigo-tint/70 blur-2xl" />
        <div aria-hidden="true" className="absolute -right-20 bottom-8 z-[1] h-80 w-80 rounded-full bg-coral-tint/70 blur-2xl" />
        <div aria-hidden="true" className="aurora-layer-1 absolute -left-20 top-[30%] z-[2] w-72 rounded-[2.5rem] rounded-bl-lg border border-indigo/10 bg-white/45 p-7 shadow-[0_24px_70px_rgba(74,63,99,0.08)] backdrop-blur-sm">
          <div className="flex gap-2"><span className="h-2 w-2 rounded-full bg-indigo/25" /><span className="h-2 w-28 rounded-full bg-indigo/10" /></div>
          <div className="mt-4 h-2 w-44 rounded-full bg-indigo/10" />
          <div className="mt-2 h-2 w-32 rounded-full bg-indigo/[0.07]" />
          <span className="absolute -bottom-3 left-8 h-7 w-7 rotate-45 border-b border-r border-indigo/10 bg-white/45" />
        </div>
        <div aria-hidden="true" className="aurora-layer-2 absolute -right-24 top-[22%] z-[2] w-80 rounded-[2.5rem] rounded-br-lg border border-sage/15 bg-sage-tint/45 p-7 shadow-[0_24px_70px_rgba(63,126,120,0.08)] backdrop-blur-sm">
          <div className="flex gap-2"><span className="h-2 w-2 rounded-full bg-sage/35" /><span className="h-2 w-36 rounded-full bg-sage/15" /></div>
          <div className="mt-4 h-2 w-52 rounded-full bg-sage/15" />
          <div className="mt-2 h-2 w-40 rounded-full bg-sage/10" />
          <span className="absolute -bottom-3 right-8 h-7 w-7 rotate-45 border-b border-r border-sage/15 bg-sage-tint/45" />
        </div>
        <div aria-hidden="true" className="aurora-layer-3 absolute -bottom-12 left-[8%] z-[2] w-64 rounded-[2rem] rounded-bl-lg border border-coral/10 bg-coral-tint/40 p-6 opacity-75 backdrop-blur-sm">
          <div className="h-2 w-36 rounded-full bg-coral/15" />
          <div className="mt-3 h-2 w-44 rounded-full bg-coral/10" />
        </div>
        <div aria-hidden="true" className="aurora-layer-4 absolute -bottom-8 right-[12%] z-[2] w-56 rounded-[2rem] rounded-br-lg border border-amber/15 bg-amber-tint/45 p-6 opacity-70 backdrop-blur-sm">
          <div className="h-2 w-28 rounded-full bg-amber/20" />
          <div className="mt-3 h-2 w-36 rounded-full bg-amber/10" />
        </div>
        <Container className="relative z-10 flex flex-col gap-12 py-20 sm:py-24">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo">
              {h.demo.eyebrow}
            </span>
            <h2 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink text-balance sm:text-5xl">
              {h.demo.heading}
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">{h.demo.body}</p>
          </div>
          <LiveDemo
            initialLang={lang}
            callouts={h.demo.callouts}
            replayNote={h.demo.replayNote}
          />
        </Container>
      </section>

      {/* 5 · Features — bento grid, each tile with a small living visual. */}
      <section className="relative isolate min-h-screen overflow-hidden bg-cream-alt">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(145deg,#f9f7f3_0%,#f5f2ee_48%,#f8f5fa_100%)]" />
        <div aria-hidden="true" className="absolute left-1/2 top-[58%] z-[1] h-[32rem] w-[58rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-white/90 blur-[70px]" />
        <div aria-hidden="true" className="absolute left-1/2 top-[56%] z-[1] h-80 w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-gradient-to-r from-indigo/10 via-sage/10 to-coral/10 blur-[90px]" />
        <div aria-hidden="true" className="absolute inset-0 z-[2] opacity-[0.18] [background-image:radial-gradient(rgba(74,63,99,0.2)_0.7px,transparent_0.7px)] [background-size:16px_16px] [mask-image:linear-gradient(to_bottom,transparent,black_28%,black_82%,transparent)]" />
        <div aria-hidden="true" className="aurora-layer-1 absolute -left-14 top-[18%] z-[3] h-44 w-44 rounded-full border border-white/80 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),rgba(232,224,243,0.55)_42%,rgba(107,91,138,0.12)_72%,rgba(255,255,255,0.35))] shadow-[inset_-18px_-20px_35px_rgba(107,91,138,0.08),inset_14px_12px_24px_rgba(255,255,255,0.8),0_28px_65px_rgba(74,63,99,0.12)] backdrop-blur-sm" />
        <div aria-hidden="true" className="aurora-layer-3 absolute -right-12 top-[34%] z-[3] h-56 w-56 rounded-full border border-white/80 bg-[radial-gradient(circle_at_32%_25%,rgba(255,255,255,0.95),rgba(214,235,232,0.58)_40%,rgba(127,185,180,0.15)_72%,rgba(255,255,255,0.3))] shadow-[inset_-22px_-24px_40px_rgba(63,126,120,0.09),inset_16px_14px_28px_rgba(255,255,255,0.85),0_32px_70px_rgba(63,126,120,0.12)] backdrop-blur-sm" />
        <div aria-hidden="true" className="aurora-layer-2 absolute bottom-[8%] left-[8%] z-[3] h-20 w-20 rounded-full border border-white/80 bg-[radial-gradient(circle_at_30%_25%,white,rgba(255,226,221,0.65)_48%,rgba(224,140,126,0.16))] shadow-[inset_-10px_-12px_20px_rgba(224,140,126,0.08),0_18px_40px_rgba(184,95,79,0.1)]" />
        <div aria-hidden="true" className="aurora-layer-4 absolute right-[12%] top-[12%] z-[3] h-12 w-12 rounded-full border border-white/90 bg-[radial-gradient(circle_at_30%_25%,white,rgba(251,238,221,0.8)_55%,rgba(224,164,88,0.16))] shadow-[0_14px_30px_rgba(224,164,88,0.12)]" />
        <Container className="relative z-10 flex min-h-screen flex-col justify-center gap-7 py-10 sm:py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage-deep">
                {h.featuresEyebrow}
              </span>
              <h2 className="max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight text-ink text-balance sm:text-5xl">
                {h.featuresHeading}{" "}
                <span className="text-indigo">{h.featuresHeadingAccent}</span>
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
                {h.featuresBody}
              </p>
            </div>
            <Link
              href={`/${lang}/features`}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo/15 bg-white/70 px-4 py-2 text-sm font-bold text-indigo shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            >
              {h.featuresLink}
              <ArrowRight size={15} />
            </Link>
          </div>

          <FeatureBento
            features={h.features}
            bento={h.bento}
            planDays={h.phone.planDays}
            hotlineName={hotlines[0].name}
            hotlineNumber={hotlines[0].phone}
          />
        </Container>
      </section>

      {/* 6 · Under the hood — the pipeline, the fusion rule, and what its
          weights reveal. Dark, like the proof band; the two never sit adjacent. */}
      <section className="relative isolate min-h-screen overflow-hidden bg-ink">
        <HolographicBeams density={18} speed={0.65} aberration={3} opacity={62} />
        <div aria-hidden="true" className="absolute inset-0 z-[3] bg-[linear-gradient(to_bottom,rgba(33,30,42,0.62)_0%,transparent_26%,transparent_72%,rgba(33,30,42,0.5)_100%)]" />
        <Container className="relative z-10 flex min-h-screen flex-col justify-center gap-6 py-10 sm:py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage">
                {h.hood.eyebrow}
              </span>
              <h2 className="text-4xl font-extrabold leading-[1.02] tracking-tight text-white text-balance sm:text-5xl">
                {h.hood.heading}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">{h.hood.body}</p>
            </div>
            <Link
              href={`/${lang}/research`}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:border-white/40 hover:bg-white/[0.08]"
            >
              {h.hood.link}
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-4">
              <PipelineDiagram labels={h.hood.nodes} />
            </div>

            <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_0.95fr_1.2fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                <p className="text-xs leading-relaxed text-white/65">{t.research.fusionBody}</p>
                <code className="mt-3 block w-fit max-w-full overflow-x-auto rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-[#CEC2E8]">
                  {t.research.fusionFormula}
                </code>
              </div>

              <div className="rounded-2xl border border-amber/20 bg-amber/[0.07] p-4 backdrop-blur-sm">
                <h3 className="mb-1.5 text-xs font-extrabold text-white">
                  {t.research.fusionInsightHeading}
                </h3>
                <p className="text-xs leading-relaxed text-white/60">
                  {t.research.fusionInsightBody}
                </p>
              </div>

              <InView className="flex flex-col gap-3 rounded-2xl border border-sage/15 bg-white/[0.05] p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-sage shadow-[0_0_14px_rgba(154,216,210,0.8)]" />
                  <h3 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/60">
                    {h.hood.weightsHeading}
                  </h3>
                </div>
                <FusionBars
                  tone="dark"
                  textLabel={h.hood.textLabel}
                  audioLabel={h.hood.audioLabel}
                  classLabels={classLabels}
                />
              </InView>
            </div>
          </div>
        </Container>
      </section>

      {/* 7 · Safety — the real hotlines, and what EmoBuddy does and doesn't do.
          Deliberately calm: no ambient motion here. */}
      <section className="relative isolate min-h-screen overflow-hidden bg-[#fff8f4]">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,#fffdfb_0%,#fff5f0_48%,#f7f1f8_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_88%_48%,rgba(224,140,126,0.34),transparent_32%),radial-gradient(circle_at_7%_82%,rgba(127,185,180,0.22),transparent_27%),radial-gradient(circle_at_48%_10%,rgba(224,164,88,0.14),transparent_24%)]" />
        <div aria-hidden="true" className="absolute -right-20 top-1/2 z-[2] h-[42rem] w-[42rem] -translate-y-1/2 rounded-full border border-coral/20 shadow-[0_0_0_70px_rgba(224,140,126,0.07),0_0_0_140px_rgba(224,140,126,0.04)]" />
        <ShieldCheck aria-hidden="true" strokeWidth={0.7} className="absolute -right-10 top-1/2 z-[2] h-[34rem] w-[34rem] -translate-y-1/2 text-coral/[0.15] drop-shadow-[0_20px_60px_rgba(224,140,126,0.16)]" />
        <div aria-hidden="true" className="absolute -left-24 bottom-[-5rem] z-[2] h-72 w-72 rounded-full border-[3rem] border-sage/10" />
        <div aria-hidden="true" className="absolute inset-0 z-[3] opacity-[0.22] [background-image:linear-gradient(rgba(184,95,79,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(184,95,79,0.12)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_right,transparent,black_55%,black)]" />
        <Container className="relative z-10 flex min-h-screen flex-col justify-center gap-7 py-10 sm:py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col items-start gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-coral/25 bg-white/65 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-coral-deep shadow-sm backdrop-blur-sm">
                <ShieldAlert size={13} aria-hidden="true" />
                {h.safetyEyebrow}
              </span>
              <h2 className="text-4xl font-extrabold leading-[1.02] tracking-tight text-ink text-balance sm:text-5xl">
                {h.safetyHeading}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">{h.safetyBody}</p>
            </div>
            <Link
              href={`/${lang}/help`}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-coral/25 bg-white/70 px-4 py-2 text-sm font-bold text-coral-deep shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            >
              {h.safetyLink}
              <ArrowRight size={15} />
            </Link>
          </div>

          <ul className="grid gap-4 md:grid-cols-3">
            {hotlines.map((line) => (
              <HotlineCard key={line.name} hotline={line} callLabel={h.hotlineCall} />
            ))}
          </ul>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="reveal flex flex-col gap-3 rounded-2xl border border-white/35 bg-sage-tint/90 p-5 shadow-[0_20px_55px_-32px_rgba(20,16,30,0.55)] backdrop-blur-md">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.13em] text-sage-deep">
                {h.safetyDoesHeading}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.help.emoBuddyDoes.map((item) => (
                  <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-ink">
                    <CircleCheck size={16} className="mt-0.5 shrink-0 text-sage-deep" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal flex flex-col gap-3 rounded-2xl border border-white/30 bg-white/90 p-5 shadow-[0_20px_55px_-32px_rgba(20,16,30,0.5)] backdrop-blur-md">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.13em] text-ink-soft">
                {h.safetyDoesNotHeading}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.help.emoBuddyDoesNot.map((item) => (
                  <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-ink">
                    <X size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* 8 · Built at PTSB · SDG 3 & 10 */}
      <section className="relative isolate min-h-screen overflow-hidden bg-[#f8f6fb]">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,#eef0f6_0%,#fafbff_42%,#eef7f6_100%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-[1] h-1 bg-gradient-to-r from-indigo via-sage to-coral" />
        <div aria-hidden="true" className="absolute left-1/2 top-[56%] z-[1] h-[30rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.96),rgba(232,224,243,0.34)_48%,transparent_72%)]" />
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <g fill="none" stroke="#6b5b8a" strokeOpacity="0.14" strokeWidth="1.2">
            <path d="M0 155 H190 L245 210 H470" />
            <path d="M1440 160 H1240 L1185 215 H970" />
            <path d="M0 720 H210 L275 655 H455" />
            <path d="M1440 735 H1220 L1160 675 H980" />
          </g>
          <g fill="#7fb9b4">
            <circle cx="245" cy="210" r="4" /><circle cx="1185" cy="215" r="4" /><circle cx="275" cy="655" r="4" /><circle cx="1160" cy="675" r="4" />
          </g>
          <g className="dash-flow" fill="none" stroke="#7fb9b4" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="5 18">
            <path d="M0 155 H190 L245 210 H470" /><path d="M1440 735 H1220 L1160 675 H980" />
          </g>
        </svg>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[2] h-[34%] origin-bottom [transform:perspective(500px)_rotateX(62deg)_scale(1.35)] opacity-[0.12] [background-image:linear-gradient(rgba(107,91,138,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(107,91,138,0.35)_1px,transparent_1px)] [background-size:52px_34px]" />
        <div aria-hidden="true" className="absolute right-[4%] top-[12%] z-[2] rounded-full border border-indigo/15 bg-white/50 px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.32em] text-indigo/50 shadow-sm backdrop-blur-md">
          NICERS&apos;26
        </div>
        <Container className="relative z-10 flex min-h-screen flex-col justify-center gap-7 py-10 sm:py-12">
          <div className="grid items-end gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-deep">
                {h.aboutEyebrow}
              </span>
              <h2 className="max-w-xl text-4xl font-extrabold leading-[1.02] tracking-tight text-ink text-balance sm:text-6xl">
                {h.aboutHeading}
              </h2>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <p className="max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base lg:text-right">{t.about.story}</p>
              <Link
                href={`/${lang}/about`}
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(74,63,99,0.22)] transition-colors hover:bg-indigo-deep"
              >
                {h.aboutLink}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-indigo/15 bg-white/80 p-5 shadow-[0_28px_80px_-34px_rgba(74,63,99,0.32)] ring-1 ring-white/80 backdrop-blur-xl sm:p-6">
              <div aria-hidden="true" className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-indigo-tint/65 blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo text-white shadow-lg">
                    <Award size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.2em] text-indigo">{h.aboutBuildEyebrow}</span>
                    <span className="text-xl font-extrabold tracking-tight text-ink">NICERS&apos;26</span>
                  </div>
                </div>
                <span className="hidden rounded-full bg-sage-tint px-3 py-1 text-[10px] font-bold text-sage-deep sm:inline">{h.aboutBuildBadge}</span>
              </div>

              <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-indigo via-sage to-coral sm:block" />
                {h.aboutBuild.map((label, index) => {
                  const Icon = buildIcons[index];
                  return (
                    <div key={label} className="relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-indigo/10 bg-white/95 p-4 text-center shadow-[0_12px_28px_-20px_rgba(74,63,99,0.45)]">
                      <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-sage shadow-[0_0_8px_rgba(127,185,180,0.8)]" />
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-tint text-indigo ring-4 ring-white">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span className="text-xs font-extrabold leading-tight text-ink">{label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="relative mt-4 flex items-start gap-3 rounded-2xl bg-indigo-tint/55 p-4">
                <GraduationCap size={18} className="mt-0.5 shrink-0 text-indigo" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-ink-soft">{t.about.institutionBody}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[2rem] border border-sage/20 bg-white/80 p-5 shadow-[0_28px_80px_-34px_rgba(63,126,120,0.3)] ring-1 ring-white/80 backdrop-blur-xl sm:p-6">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-sage-deep">{h.sdgLabel} 3 · {h.sdgLabel} 10</span>
                <h3 className="mt-1.5 text-lg font-extrabold tracking-tight text-ink">{t.about.sdgHeading}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{t.about.sdgBody}</p>
              </div>
              {sdgs.map((s) => (
                <div key={s.n} className="reveal flex items-center gap-4 rounded-2xl border border-outline/50 bg-white/90 p-3.5 shadow-sm">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-lg" style={{ backgroundColor: s.colour }}>
                    <span className="text-[8px] font-extrabold uppercase tracking-wider opacity-90">{h.sdgLabel}</span>
                    <span className="text-xl font-extrabold leading-none">{s.n}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 9 · FAQ */}
      <section className="relative isolate min-h-screen overflow-hidden bg-cream-alt">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[38%] bg-indigo-deep [clip-path:polygon(0_0,100%_0,84%_100%,0_100%)]" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-[70%] bg-[#f1edf5]" />
        <div aria-hidden="true" className="absolute -left-10 bottom-[-7rem] z-[1] select-none text-[28rem] font-black leading-none text-white/[0.035]">?</div>
        <div aria-hidden="true" className="absolute right-[4%] top-[10%] z-[1] grid grid-cols-5 gap-2 opacity-25">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} className={`h-1.5 w-1.5 rounded-full ${index % 4 === 0 ? "bg-coral" : "bg-indigo/30"}`} />
          ))}
        </div>
        <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] items-center gap-8 px-6 py-10 sm:py-12 lg:grid-cols-[0.28fr_0.72fr] lg:gap-8">
          <div className="flex flex-col items-start gap-4 lg:pr-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage backdrop-blur-sm">
              {h.faq.eyebrow}
            </span>
            <h2 className="text-4xl font-extrabold leading-[1.02] tracking-tight text-white text-balance sm:text-5xl">
              {h.faq.heading}
            </h2>
            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-sage via-amber to-coral" />
            <p className="max-w-sm text-sm leading-relaxed text-white/65">{h.faq.body}</p>
            <div className="mt-2 grid w-full grid-cols-3 gap-2 lg:grid-cols-1">
              {h.faq.facts.map((fact) => (
                <div key={fact.label} className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5 backdrop-blur-sm lg:flex lg:items-center lg:gap-3">
                  <span className="block text-lg font-extrabold tracking-tight text-white">{fact.value}</span>
                  <span className="block text-[9px] font-bold uppercase leading-tight tracking-[0.1em] text-sage/75">{fact.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Faq items={h.faq.items} />
        </div>
      </section>

      {/* 10 · Final CTA — slowly shifting gradient with a dark aurora over it. */}
      <section className="relative isolate min-h-[72vh] overflow-hidden bg-[#f7f5fa]">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,#fbfafc_0%,#eef6f5_58%,#f8f1ee_100%)]" />
        <div aria-hidden="true" className="absolute -left-[10%] -top-[45%] z-[1] h-[100%] w-[52%] rotate-[-10deg] border border-indigo/10 bg-indigo-tint/45" />
        <div aria-hidden="true" className="absolute -bottom-[58%] -right-[5%] z-[1] h-[100%] w-[58%] rotate-[-10deg] border border-coral/10 bg-coral-tint/35" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 select-none text-[8rem] font-black tracking-[-0.08em] text-indigo/[0.035] sm:text-[13rem] lg:text-[16rem]">
          EMOBUDDY
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-indigo/30 to-transparent" />
        <Container className="relative z-10 grid min-h-[72vh] items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="flex flex-col items-start gap-5">
            <span className="rounded-full border border-indigo/15 bg-white/60 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo backdrop-blur-sm">
              EmoBuddy
            </span>
            <h2 className="max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">
              {h.finalCtaHeading}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">{h.finalCtaBody}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${lang}/signup`}
                className="inline-flex items-center gap-2 rounded-full bg-indigo px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_18px_45px_rgba(74,63,99,0.22)] transition-[transform,background-color] hover:[transform:translateY(-2px)] hover:bg-indigo-deep"
              >
                {h.finalCtaButton}
                <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${lang}/how-it-works`}
                className="inline-flex items-center gap-2 rounded-full border border-indigo/15 bg-white/55 px-6 py-3.5 text-sm font-bold text-indigo backdrop-blur-sm transition-colors hover:bg-white"
              >
                {h.ctaSecondary}
              </Link>
            </div>
            <p className="text-xs leading-relaxed text-ink-faint">{h.trustLine}</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div aria-hidden="true" className="absolute -inset-4 rotate-3 rounded-[2.25rem] border border-indigo/10 bg-indigo/5" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_30px_80px_rgba(74,63,99,0.16)] backdrop-blur-xl sm:p-7">
              <div className="mb-6 flex items-center justify-center">
                <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-sage/30 bg-sage-tint text-sage-deep shadow-[0_0_45px_rgba(127,185,180,0.18)]">
                  <span aria-hidden="true" className="pulse-ring absolute inset-0 rounded-2xl border border-sage/25" />
                  <CircleCheck size={38} strokeWidth={1.6} aria-hidden="true" />
                </span>
              </div>
              <div className="grid gap-3">
                {h.pills.map((pill, index) => (
                  <div key={pill} className="flex items-center gap-3 rounded-2xl border border-outline/50 bg-white/70 p-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-tint text-[9px] font-extrabold text-indigo">0{index + 1}</span>
                    <span className="text-sm font-bold text-ink">{pill}</span>
                    <CircleCheck size={15} className="ml-auto shrink-0 text-sage-deep" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
