import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  CircleCheck,
  GitBranch,
  LogIn,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { PipelineDiagram } from "@/components/marketing/PipelineDiagram";
import { FusionBars } from "@/components/marketing/FusionBars";
import { InView } from "@/components/marketing/InView";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { EMOTION_CLASSES, type EmotionClass } from "@/lib/metrics";

const STEP_ICONS = [LogIn, MessageSquareText, ShieldAlert, BrainCircuit, Sparkles];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.nav.howItWorks, description: t.howItWorks.subheading };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const h = t.howItWorks;
  const home = t.home;
  const classLabels = Object.fromEntries(EMOTION_CLASSES.map((emotion, index) => [emotion, home.hood.classes[index]])) as Record<EmotionClass, string>;

  return (
    <>
      {/* Hero — the pipeline itself is the picture: five connected steps, with
          the crisis branch forking off step 3. Light aurora like the Home hero,
          so page openers alternate light/dark across the site. */}
      <section className="relative isolate">
        <AuroraBackground />
        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-12 px-6 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-24">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-sage-deep">{h.eyebrow}</span>
            <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tight text-ink text-balance sm:text-6xl lg:text-7xl">{h.heading}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">{h.subheading}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={`/${lang}/signup`}
                className="inline-flex items-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-deep"
              >
                {home.ctaPrimary}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#process"
                className="inline-flex items-center gap-2 rounded-full border border-outline bg-white/60 px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-white"
              >
                {home.stepsLink}
                <ArrowDown size={15} />
              </Link>
            </div>
            <p className="text-xs text-ink-faint">{home.trustLine}</p>
          </div>

          {/* Pipeline rail */}
          <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_30px_70px_-40px_rgba(46,42,58,0.45)] backdrop-blur-md sm:p-8">
          <ol className="relative">
            <span aria-hidden="true" className="absolute bottom-8 left-[19px] top-8 w-px bg-outline" />
            {h.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              const crisis = index === 2;
              return (
                <li
                  key={step.title}
                  className="fade-up-in relative grid grid-cols-[40px_1fr] items-start gap-4 py-3"
                  style={{ animationDelay: `${140 + index * 110}ms` }}
                >
                  <span
                    className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-extrabold ${
                      crisis ? "border-coral-deep bg-coral-tint text-coral-deep" : "border-indigo/30 bg-white text-indigo"
                    }`}
                  >
                    0{index + 1}
                  </span>
                  <div className="pt-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-base font-bold text-ink">
                      <Icon size={16} className={crisis ? "text-coral-deep" : "text-indigo"} aria-hidden="true" />
                      {step.title}
                    </div>
                    {crisis && (
                      <div className="mt-2.5 flex items-center gap-2 border-l-2 border-dashed border-coral pl-3 text-xs font-bold text-coral-deep">
                        <GitBranch size={14} aria-hidden="true" />
                        {home.hood.nodes.hotlines}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-outline/70 pt-4 text-xs leading-relaxed text-ink-faint">{h.crisisNote}</p>
          </div>
        </div>
      </section>

      <section id="process" className="relative isolate overflow-hidden bg-[#f7f5fa]">
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-tint/80 blur-3xl" />
        <div className="relative mx-auto flex w-full max-w-[1400px] flex-col justify-center px-6 py-12 lg:min-h-[calc(100svh-72px)] lg:py-10">
          <div className="mb-8 flex flex-col gap-4 border-b border-ink/15 pb-7 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sage-deep">{h.eyebrow} · 01—05</span>
              <h2 className="mt-3 max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.045em] text-ink sm:text-5xl">{h.heading}</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft sm:text-right">{h.subheading}</p>
          </div>

          <div className="relative grid gap-3 md:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-gradient-to-r from-indigo/20 via-indigo to-sage-deep/30 lg:block" />
            {h.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              const crisis = index === 2;
              return (
                <article
                  key={step.title}
                  className={`group relative flex min-h-[240px] flex-col overflow-hidden rounded-[1.6rem] border p-5 shadow-[0_18px_45px_-35px_rgba(46,42,58,0.5)] transition-transform duration-300 hover:-translate-y-1 lg:min-h-[310px] lg:p-6 ${
                    crisis ? "border-coral/50 bg-coral-deep text-white" : "border-white bg-white/85 text-ink backdrop-blur-sm"
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <span className={`text-xs font-black tracking-[0.18em] ${crisis ? "text-white/65" : "text-ink-faint"}`}>0{index + 1}</span>
                    <span className={`grid h-11 w-11 place-items-center rounded-full border ${crisis ? "border-white/25 bg-white/10 text-white" : "border-indigo/15 bg-indigo-tint/55 text-indigo"}`}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="relative z-10 mt-auto pt-10">
                    {crisis && (
                      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white">
                        <GitBranch size={11} aria-hidden="true" />
                        {home.stepsOverrideChip}
                      </span>
                    )}
                    <h3 className="text-xl font-black leading-[1.05] tracking-[-0.025em] lg:text-2xl">{step.title}</h3>
                    <p className={`mt-3 text-xs leading-relaxed lg:text-[13px] ${crisis ? "text-white/72" : "text-ink-soft"}`}>{step.body}</p>
                  </div>
                  <span aria-hidden="true" className={`absolute -bottom-9 -right-3 text-[8rem] font-black leading-none tracking-[-0.1em] ${crisis ? "text-white/[0.045]" : "text-indigo/[0.035]"}`}>0{index + 1}</span>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-coral/25 bg-coral-tint/55 px-4 py-3 text-xs leading-relaxed text-coral-deep lg:mx-auto lg:max-w-4xl">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{h.crisisNote}</p>
          </div>
        </div>
      </section>

      <section className="bg-coral-deep text-white">
        <div className="mx-auto grid min-h-[72vh] w-full max-w-[1400px] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col justify-center border-b border-white/20 px-6 py-14 lg:border-b-0 lg:border-r lg:px-12">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-coral-tint">{home.stepsOverrideChip}</span>
            <h2 className="mt-5 text-5xl font-black leading-[0.94] tracking-[-0.05em] sm:text-7xl">{h.steps[2].title}</h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/72">{h.crisisNote}</p>
          </div>
          <div className="flex items-center px-6 py-14 lg:px-12">
            <div className="w-full border-y border-white/30">
              <div className="flex items-center gap-4 border-b border-white/20 py-5">
                <GitBranch size={22} />
                <span className="text-sm font-black uppercase tracking-[0.15em]">{home.hood.nodes.crisis}</span>
              </div>
              <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-white/20">
                <div className="py-8 sm:pr-8">
                  <span className="text-6xl font-black text-white/15">01</span>
                  <h3 className="mt-5 text-2xl font-black">{home.hood.nodes.hotlines}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{home.safetyBody}</p>
                </div>
                <div className="py-8 sm:pl-8">
                  <span className="text-6xl font-black text-white/15">02</span>
                  <h3 className="mt-5 text-2xl font-black">{home.hood.nodes.textModel} + {home.hood.nodes.audioModel}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{h.steps[3].body}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#15141a] text-white">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-16 sm:py-24">
          <div className="grid gap-8 border-b border-white/15 pb-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sage">{home.hood.eyebrow}</span>
              <h2 className="mt-4 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.05em] sm:text-7xl">{home.hood.heading}</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/55 lg:text-right">{h.techNote}</p>
          </div>

          <div className="overflow-x-auto border-b border-white/15 py-10">
            <PipelineDiagram labels={home.hood.nodes} />
          </div>

          <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
            <div>
              <p className="max-w-2xl text-base leading-relaxed text-white/65">{t.research.fusionBody}</p>
              <code className="mt-6 block w-fit max-w-full overflow-x-auto border-l-2 border-[#CEC2E8] pl-5 text-sm text-[#CEC2E8]">{t.research.fusionFormula}</code>
            </div>
            <InView>
              <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.18em] text-sage">{home.hood.weightsHeading}</h3>
              <FusionBars tone="dark" textLabel={home.hood.textLabel} audioLabel={home.hood.audioLabel} classLabels={classLabels} />
            </InView>
          </div>
        </div>
      </section>

      <section className="bg-sage-tint">
        <div className="mx-auto grid min-h-[68vh] w-full max-w-[1400px] lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col justify-center border-b border-sage/40 px-6 py-14 lg:border-b-0 lg:border-r lg:px-12">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sage-deep">05 / {h.steps[4].title}</span>
            <h2 className="mt-5 text-5xl font-black leading-[0.94] tracking-[-0.05em] text-ink sm:text-7xl">{home.phone.planTitle}</h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">{h.steps[4].body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${lang}/signup`} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-extrabold text-white hover:bg-indigo">{home.ctaPrimary}<ArrowRight size={16} /></Link>
              <Link href={`/${lang}/research`} className="inline-flex items-center gap-2 border border-sage-deep/25 px-6 py-3 text-sm font-bold text-ink hover:bg-white/40">{home.statsLink}</Link>
            </div>
          </div>
          <div className="flex items-center px-6 py-14 lg:px-12">
            <div className="w-full border-t-2 border-sage-deep">
              {home.phone.planDays.map((day, index) => (
                <div key={day} className="grid grid-cols-[70px_1fr] items-center border-b border-sage-deep/25 py-6">
                  <span className="text-4xl font-black text-sage-deep/25">0{index + 1}</span>
                  <div className="flex items-center gap-4"><CircleCheck size={19} className={index === 0 ? "text-sage-deep" : index === 1 ? "text-blue" : "text-coral-deep"} /><span className="text-base font-bold text-ink">{day}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
