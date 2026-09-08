import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CircleCheck,
  Database,
  Globe2,
  GraduationCap,
  History,
  Languages,
  ListChecks,
  LockKeyhole,
  Mic,
  MicOff,
  Scale,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Container";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";

const FEATURE_ICONS = [Languages, Mic, Scale, ListChecks, ShieldCheck, History, MicOff];
const DIFFERENCE_ICONS = [Languages, BrainCircuit, ShieldCheck];
// Lighter brand tints — the variants that hold up on the dark band.
const DIFFERENCE_ACCENTS = [
  { hex: "#CEC2E8", tint: "rgba(206,194,232,0.12)" },
  { hex: "#9AD8D2", tint: "rgba(154,216,210,0.12)" },
  { hex: "#E08C7E", tint: "rgba(224,140,126,0.14)" },
];
const BUILD_ICONS = [Smartphone, BrainCircuit, Database, Globe2];
const FEATURE_ACCENTS = ["bg-indigo", "bg-sage-deep", "bg-coral-deep", "bg-amber", "bg-coral-deep", "bg-indigo", "bg-sage-deep"];
const FEATURE_ICON_SURFACES = [
  "bg-indigo-tint text-indigo",
  "bg-sage-tint text-sage-deep",
  "bg-coral-tint text-coral-deep",
  "bg-amber-tint text-amber",
  "bg-coral-tint text-coral-deep",
  "bg-indigo-tint text-indigo",
  "bg-sage-tint text-sage-deep",
];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.nav.features, description: t.features.subheading };
}

export default async function FeaturesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const f = t.features;
  const h = t.home;

  return (
    <>
      {/* Hero — aurora bleeds up behind the floating nav (no seam), and the
          section is sized by its content rather than forced to a viewport. */}
      <section className="relative isolate overflow-x-clip">
        <AuroraBackground variant="corner-whispers" intensity={0.55} />
        <div
          aria-hidden="true"
          className="dot-grid pointer-events-none absolute inset-x-0 -top-32 bottom-0 z-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,black_5%,transparent_100%)]"
        />
        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] items-center gap-10 px-6 pb-16 pt-12 sm:pt-16 lg:pb-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="flex flex-col items-start gap-6">
            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-deep">
              <span className="h-2 w-2 rounded-full bg-sage-deep" />
              {f.eyebrow}
            </span>
            <h1 className="max-w-[780px] text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] text-ink text-balance sm:text-6xl lg:text-7xl">
              {f.heading}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">{f.subheading}</p>
            <div className="flex flex-wrap gap-2">
              {h.pills.map((pill, index) => (
                <span key={pill} className={`rounded-full px-3.5 py-2 text-xs font-bold ${index === 0 ? "bg-white text-sage-deep" : index === 1 ? "bg-indigo-tint text-indigo" : "bg-coral-tint text-coral-deep"}`}>{pill}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${lang}/signup`} className="inline-flex items-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-extrabold text-white shadow-[0_16px_38px_rgba(74,63,99,0.2)] transition-[transform,background-color] hover:[transform:translateY(-2px)] hover:bg-indigo-deep">
                {h.ctaPrimary}
                <ArrowRight size={16} />
              </Link>
              <Link href={`/${lang}/research`} className="inline-flex items-center gap-2 rounded-full border border-indigo/15 bg-white/60 px-6 py-3 text-sm font-bold text-indigo transition-colors hover:bg-white">{h.statsLink}</Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[720px]">
            <div aria-hidden="true" className="absolute -inset-5 translate-x-3 translate-y-3 rounded-[2.5rem] border border-indigo/10 bg-indigo/10" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_35px_90px_rgba(74,63,99,0.2)]">
              <div className="flex items-center justify-between border-b border-outline/60 bg-[#faf9fc] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo text-white"><Sparkles size={16} /></span>
                  <div>
                    <span className="block text-sm font-extrabold text-ink">EmoBuddy</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-sage-deep">{h.flow[1]}</span>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-tint px-3 py-1 text-[10px] font-extrabold text-indigo">{lang === "ms" ? "BM" : "EN"}</span>
              </div>

              <div className="grid min-h-[420px] md:grid-cols-[1.12fr_0.88fr]">
                <div className="flex flex-col border-b border-outline/60 p-5 md:border-b-0 md:border-r sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-indigo">{h.flow[0]}</span>
                    <Mic size={17} className="text-sage-deep" />
                  </div>
                  <div className="mt-8 ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-indigo px-4 py-3 text-sm leading-relaxed text-white">{h.phone.userMsg}</div>
                  <div className="mt-3 max-w-[90%] rounded-2xl rounded-bl-sm border border-outline/60 bg-cream px-4 py-3 text-sm leading-relaxed text-ink">{h.phone.aiMsg}</div>
                  <div className="mt-auto flex items-center gap-2 rounded-xl bg-sage-tint px-3 py-2.5 text-xs font-bold text-sage-deep">
                    <ShieldCheck size={14} />
                    {h.pills[2]}
                  </div>
                </div>

                <div className="flex flex-col gap-4 bg-[#f8f6fa] p-5 sm:p-6">
                  <div className="rounded-2xl border border-indigo/10 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-indigo">{h.hood.nodes.emotion}</span>
                      <BrainCircuit size={16} className="text-indigo" />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-tint text-sm font-extrabold text-indigo">{h.hood.classes[1]}</span>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-cream"><div className="h-full w-[72%] rounded-full bg-indigo" /></div>
                        <span className="mt-1.5 block text-[9px] text-ink-faint">{h.hood.nodes.fusion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 rounded-2xl border border-sage/20 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ListChecks size={16} className="text-sage-deep" />
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-sage-deep">{h.phone.planTitle}</span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {h.phone.planDays.map((day, index) => (
                        <div key={day} className="flex items-start gap-2 rounded-xl bg-cream px-3 py-2 text-[10px] leading-snug text-ink">
                          <CircleCheck size={13} className={`mt-0.5 shrink-0 ${index === 0 ? "text-sage-deep" : index === 1 ? "text-blue" : "text-coral-deep"}`} />
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#201d29] text-white">
        <Container className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {h.stats.map((stat, index) => (
            <div key={stat.label} className="relative px-6 py-8 sm:px-8">
              <span className="absolute right-5 top-4 text-[9px] font-extrabold text-white/20">0{index + 1}</span>
              <span className="block text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{stat.value}</span>
              <span className="mt-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-sage">{stat.label}</span>
              <span className="mt-2 block text-[10px] leading-relaxed text-white/40">{stat.detail}</span>
            </div>
          ))}
        </Container>
      </section>

      <section className="relative isolate overflow-hidden bg-[#f3efe6]">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-20 hidden w-1/2 bg-[#332d43] lg:block" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1 bg-gradient-to-r from-indigo via-sage to-amber" />
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1440 760" preserveAspectRatio="none">
          <g fill="none" stroke="#6B5B8A" strokeOpacity="0.13" strokeWidth="1">
            <path d="M0 120 H145 V185 H310 V95 H470" />
            <path d="M0 610 H120 V530 H280 V650 H515" />
            <path d="M90 0 V80 H230 V250 H390" />
            <circle cx="145" cy="185" r="5" /><circle cx="310" cy="95" r="5" /><circle cx="280" cy="650" r="5" />
            <path d="M80 330 H590" strokeDasharray="4 10" />
            <path d="M520 40 V720" strokeOpacity="0.07" />
          </g>
          <g fill="none" stroke="#9AD8D2" strokeOpacity="0.2" strokeWidth="1.2">
            <path d="M760 90 H900 V150 H1080 V80 H1440" />
            <path d="M720 650 H850 V570 H1040 V675 H1440" />
            <path d="M820 0 V70 H980 V250 H1310" />
            <path d="M760 350 H1390" strokeDasharray="5 12" />
          </g>
          <g fill="#9AD8D2" fillOpacity="0.45">
            <circle cx="900" cy="150" r="4" /><circle cx="1080" cy="80" r="4" /><circle cx="850" cy="570" r="4" /><circle cx="1040" cy="675" r="4" />
          </g>
          <text x="55" y="705" fill="#6B5B8A" fillOpacity="0.055" fontSize="245" fontWeight="900" letterSpacing="-15">FYP</text>
          <text x="1130" y="700" fill="#FFFFFF" fillOpacity="0.035" fontSize="220" fontWeight="900">26</text>
        </svg>
        <Container className="relative grid gap-12 py-18 sm:py-24 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-coral-deep">{f.identityEyebrow}</span>
            <h2 className="text-4xl font-extrabold leading-[1.02] tracking-tight text-ink text-balance sm:text-6xl">{f.identityHeading}</h2>
            <p className="max-w-xl text-base leading-relaxed text-ink-soft">{f.identityBody}</p>
            <div className="flex items-start gap-3 border-t border-ink/15 pt-5">
              <GraduationCap size={20} className="mt-0.5 shrink-0 text-indigo" />
              <p className="text-sm leading-relaxed text-ink-faint">{t.about.institutionBody}</p>
            </div>
          </div>

          <div className="relative pl-8 sm:pl-12">
            <div aria-hidden="true" className="absolute bottom-7 left-[1.15rem] top-7 w-px bg-indigo/25 sm:left-[2.15rem] lg:bg-sage/35" />
            <div className="flex flex-col gap-3">
              {h.aboutBuild.map((label, index) => {
                const Icon = BUILD_ICONS[index];
                return (
                  <div key={label} className="group relative flex items-center gap-5 border border-ink/10 bg-white/90 p-4 shadow-[0_18px_45px_-28px_rgba(20,16,30,0.55)] transition-transform hover:translate-x-2 lg:border-white/20">
                    <span className="absolute -left-[2.05rem] flex h-8 w-8 items-center justify-center rounded-full bg-indigo text-[9px] font-extrabold text-white ring-4 ring-[#f3efe6] sm:-left-[2.55rem] lg:bg-coral-deep lg:ring-[#332d43]">{index + 1}</span>
                    <span className="flex h-11 w-11 items-center justify-center bg-indigo-tint text-indigo"><Icon size={20} /></span>
                    <h3 className="text-lg font-extrabold tracking-tight text-ink">{label}</h3>
                    <ArrowRight size={15} className="ml-auto text-ink-faint" />
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <section className="relative isolate min-h-screen overflow-hidden bg-[#f1eef4]">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 h-full w-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chrome-base" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F9F7FB" />
              <stop offset="48%" stopColor="#EEEAF2" />
              <stop offset="100%" stopColor="#E4EEEC" />
            </linearGradient>
            <linearGradient id="chrome-left" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#302A40" />
              <stop offset="18%" stopColor="#9A8AB8" />
              <stop offset="34%" stopColor="#F7F3FF" />
              <stop offset="48%" stopColor="#6B5B8A" />
              <stop offset="68%" stopColor="#CEC2E8" />
              <stop offset="100%" stopColor="#3F7E78" />
            </linearGradient>
            <linearGradient id="chrome-right" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#315F5B" />
              <stop offset="20%" stopColor="#9AD8D2" />
              <stop offset="38%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#7FB9B4" />
              <stop offset="76%" stopColor="#FFE2DD" />
              <stop offset="100%" stopColor="#B85F4F" />
            </linearGradient>
            <filter id="chrome-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="28" stdDeviation="28" floodColor="#4A3F63" floodOpacity="0.25" />
            </filter>
            <filter id="chrome-warp" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.015" numOctaves="2" seed="11" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="24" />
            </filter>
          </defs>
          <rect width="1440" height="800" fill="url(#chrome-base)" />
          <g filter="url(#chrome-shadow)">
            <path d="M-180 -70 C40 20 290 -5 355 145 C420 295 205 350 300 500 C390 642 535 690 470 870 H-180Z" fill="url(#chrome-left)" filter="url(#chrome-warp)" />
            <path d="M1620 -80 C1375 -5 1185 20 1120 165 C1048 328 1245 395 1140 535 C1040 670 930 730 985 880 H1620Z" fill="url(#chrome-right)" filter="url(#chrome-warp)" />
          </g>
          <path d="M-40 95 C160 150 350 75 385 220 C420 365 255 395 330 535" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="3" />
          <path d="M1490 80 C1310 135 1140 95 1095 220 C1045 360 1215 410 1128 545" fill="none" stroke="white" strokeOpacity="0.76" strokeWidth="3" />
          <path d="M470 0 V800 M970 0 V800" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
        </svg>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1 bg-gradient-to-r from-indigo via-sage to-coral" />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col justify-center gap-4 px-6 py-8 sm:py-10">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo">{f.showcaseEyebrow}</span>
              <h2 className="mt-2 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight text-ink text-balance sm:text-5xl">{f.showcaseHeading}</h2>
            </div>
            <p className="max-w-2xl border-l border-ink/15 pl-5 text-sm leading-relaxed text-ink-soft lg:justify-self-end">{h.featuresBody}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12">
            {f.items.map((item, index) => {
              const Icon = FEATURE_ICONS[index];
              return (
                <article key={item.title} className={`group relative flex min-h-[215px] flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/88 p-4.5 text-ink shadow-[0_20px_48px_-30px_rgba(74,63,99,0.35)] backdrop-blur-sm transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_28px_58px_-26px_rgba(74,63,99,0.38)] ${index < 4 ? "lg:col-span-3" : "lg:col-span-4"}`}>
                  <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${FEATURE_ACCENTS[index]}`} />
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${FEATURE_ICON_SURFACES[index]}`}><Icon size={17} /></span>
                    <span className="text-[10px] font-extrabold tracking-[0.15em] text-ink-faint">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-base font-extrabold leading-tight tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">{item.body}</p>
                  <div className="mt-auto pt-3">
                    {index === 0 && <div className="flex gap-2"><span className="rounded-full bg-indigo-tint px-2.5 py-1 text-[9px] font-extrabold text-indigo">EN</span><span className="rounded-full bg-sage-tint px-2.5 py-1 text-[9px] font-extrabold text-sage-deep">BM</span></div>}
                    {index === 1 && <div className="flex h-6 items-center gap-1">{[8, 16, 11, 22, 14, 19, 9, 17, 12].map((height, bar) => <span key={bar} className="w-1 rounded-full bg-sage-deep/55" style={{ height }} />)}</div>}
                    {index === 2 && <div className="grid gap-1.5"><div className="flex h-1.5 overflow-hidden rounded-full bg-cream"><span className="w-[58%] bg-indigo" /><span className="flex-1 bg-sage" /></div><div className="flex justify-between text-[8px] font-bold text-ink-faint"><span>{h.hood.textLabel}</span><span>{h.hood.audioLabel}</span></div></div>}
                    {index === 3 && <div className="flex gap-2">{h.phone.planDays.map((day, dayIndex) => <span key={day} className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-tint text-[9px] font-extrabold text-amber">{dayIndex + 1}</span>)}</div>}
                    {index === 4 && <div className="flex items-center gap-2 rounded-lg bg-coral-tint px-2.5 py-1.5 text-[9px] font-extrabold text-coral-deep"><ShieldCheck size={12} />{h.pills[2]}</div>}
                    {index === 5 && <div className="grid gap-1">{h.bento.historyRows.map((row) => <span key={row} className="h-1.5 rounded-full bg-indigo/10" style={{ width: `${55 + row.length % 35}%` }} />)}</div>}
                    {index === 6 && <div className="flex items-center gap-2 text-[9px] font-extrabold text-sage-deep"><MicOff size={13} /><span className="h-px flex-1 bg-sage/35" />{h.bento.onlyYou}</div>}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid items-center gap-4 rounded-2xl border border-indigo/10 bg-indigo-deep px-5 py-4 text-white shadow-[0_18px_45px_-28px_rgba(74,63,99,0.5)] sm:grid-cols-[1fr_1.25fr_auto]">
            <h3 className="text-base font-extrabold tracking-tight sm:text-lg">{f.showcaseFooterHeading}</h3>
            <p className="text-[11px] leading-relaxed text-white/60 sm:border-l sm:border-white/10 sm:pl-5">{f.showcaseFooterBody}</p>
            <Link href={`/${lang}/signup`} className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-indigo-deep hover:bg-cream">
              {h.ctaPrimary}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why EmoBuddy stands out — a dark band matching the home page's proof
          section, so the site reads as one system. Content sizes the section;
          no forced viewport height, no arbitrary colour blocks. */}
      <section className="relative isolate overflow-hidden bg-ink">
        <AuroraBackground tone="dark" intensity={0.5} className="absolute inset-0" />
        <div
          aria-hidden="true"
          className="dot-grid absolute inset-0 z-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_65%_70%_at_50%_45%,black_10%,transparent_100%)]"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-6 py-20 sm:py-24">
          <div className="grid items-end gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-sage">{f.differenceEyebrow}</span>
              <h2 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">{f.differenceHeading}</h2>
            </div>
            <p className="border-l border-white/20 pl-5 text-sm leading-relaxed text-white/60 lg:justify-self-end">{f.subheading}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {f.differences.map((item, index) => {
              const Icon = DIFFERENCE_ICONS[index];
              const a = DIFFERENCE_ACCENTS[index];
              const proof = index === 0 ? h.pills[1] : index === 1 ? h.pills[0] : h.pills[2];
              return (
                <article
                  key={item.title}
                  className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-7 transition-colors duration-300 hover:bg-white/[0.08]"
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: a.hex }} />
                  <span aria-hidden="true" className="pointer-events-none absolute right-4 top-2 text-[6.5rem] font-black leading-none tracking-[-0.07em] text-white/[0.05]">
                    0{index + 1}
                  </span>
                  <span
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: a.tint, color: a.hex }}
                  >
                    <Icon size={22} />
                  </span>
                  <h3 className="relative mt-8 text-2xl font-extrabold leading-tight tracking-tight text-white">{item.title}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/60">{item.body}</p>
                  <div className="relative mt-auto pt-6">
                    <span
                      className="inline-flex rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.11em]"
                      style={{ background: a.tint, color: a.hex }}
                    >
                      {proof}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 sm:grid-cols-[1fr_auto]">
            <p className="text-xs text-white/50">{h.trustLine}</p>
            <Link
              href={`/${lang}/research`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-indigo-deep transition-colors hover:bg-cream"
            >
              {h.statsLink}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="relative isolate min-h-[58vh] overflow-hidden bg-[#f7f4ef]">
        <div aria-hidden="true" className="absolute -right-28 top-1/2 -z-20 h-[26rem] w-[38rem] -translate-y-1/2 rounded-[5rem] rounded-br-2xl border-[2.5rem] border-sage/10" />
        <div aria-hidden="true" className="absolute -bottom-10 left-[8%] -z-20 h-36 w-36 rotate-12 rounded-[2.5rem] rounded-bl-md border-[1.5rem] border-indigo/5" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-indigo/25 to-transparent" />
        <Container className="grid min-h-[58vh] gap-10 py-12 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div className="flex flex-col items-start gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral-tint/60 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-coral-deep">
              <ShieldCheck size={13} />
              {h.safetyEyebrow}
            </span>
            <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight text-ink text-balance sm:text-5xl">{h.finalCtaHeading}</h2>
            <p className="max-w-xl text-base leading-relaxed text-ink-soft">{h.finalCtaBody}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${lang}/signup`} className="inline-flex items-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-extrabold text-white shadow-[0_16px_38px_rgba(74,63,99,0.2)] hover:bg-indigo-deep">
                {h.finalCtaButton}
                <ArrowRight size={16} />
              </Link>
              <Link href={`/${lang}/help`} className="inline-flex items-center gap-2 rounded-full border border-outline bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-cream">
                <LockKeyhole size={15} />
                {t.footer.getHelp}
              </Link>
            </div>
            <p className="text-xs text-ink-faint">{h.trustLine}</p>
          </div>

          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-4 translate-x-3 translate-y-3 rounded-[2.25rem] border border-indigo/10 bg-indigo/5" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_30px_80px_-35px_rgba(74,63,99,0.35)] backdrop-blur-md sm:p-7">
              <div className="flex items-center gap-3 border-b border-outline/60 pb-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-tint text-indigo"><Sparkles size={17} /></span>
                <div>
                  <span className="block text-sm font-extrabold text-ink">EmoBuddy</span>
                  <span className="text-[10px] text-ink-faint">{t.chat.greeting}</span>
                </div>
              </div>
              <div className="my-6 rounded-2xl rounded-bl-md bg-cream px-4 py-3 text-sm leading-relaxed text-ink-soft">{h.phone.aiMsg}</div>
              <div className="flex items-center gap-3 rounded-2xl border border-outline bg-white p-2 pl-4 shadow-inner">
                <span className="flex-1 text-sm text-ink-faint">{t.chat.inputPlaceholder}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-tint text-sage-deep"><Mic size={16} /></span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo text-white"><Send size={15} /></span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {h.flow.map((step, index) => (
                  <div key={step} className="text-center">
                    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-indigo-tint text-[9px] font-extrabold text-indigo">{index + 1}</span>
                    <span className="mt-1.5 block text-[9px] font-bold leading-tight text-ink-faint">{step}</span>
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
