import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Container";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { TEXT_MODEL, AUDIO_MODEL } from "@/lib/metrics";

// Official UN SDG colours.
const SDG_COLOURS = { 3: "#4C9F38", 10: "#DD1367" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.nav.about, description: t.about.story.slice(0, 140) };
}

/* Section opener: the numeral is the index of a real, ordered document. */
function Opener({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-3 border-t-2 border-ink pt-5">
      <div className="flex items-baseline gap-4">
        <span className="text-sm font-extrabold tabular-nums text-indigo">0{n}</span>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
      </div>
      {sub && <p className="max-w-2xl text-base leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const a = t.about;
  const ids = ["question", "people", "build", "commitments", "receipts"];

  // The story's first sentence carries the thesis; set it large.
  const cut = a.story.indexOf("?") + 1;
  const lede = cut > 0 ? a.story.slice(0, cut) : a.story;
  const rest = cut > 0 ? a.story.slice(cut).trim() : "";

  const spec = [a.institutionName, a.department, a.session, `${a.competition} · ${a.competitionSub}`];
  const people = [
    { role: a.roleStudent, name: a.studentName, sub: a.session },
    { role: a.roleSupervisor, name: a.supervisorName, sub: a.supervisorSub },
  ];
  const receipts = [
    { value: `${Math.round(TEXT_MODEL.accuracy * 100)}%`, label: t.home.stats[0].label, detail: t.home.stats[0].detail },
    { value: `${(AUDIO_MODEL.meanAccuracy * 100).toFixed(1)}%`, label: t.home.stats[1].label, detail: t.home.stats[1].detail },
    { value: TEXT_MODEL.testSamples.toLocaleString("en-US"), label: t.home.stats[2].label, detail: t.home.stats[2].detail },
  ];
  const [clientA, clientB, inference, database] = a.built;

  return (
    <>
      {/* Document header — the title and the spec line, like the front of a report. */}
      <section className="relative isolate overflow-x-clip">
        <AuroraBackground intensity={0.4} />
        <Container className="relative z-10 flex flex-col gap-8 pb-14 pt-12 sm:pt-16 lg:pb-20">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-sage-deep">
            <Sparkles size={13} aria-hidden="true" />
            {a.eyebrow}
          </span>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-tight text-ink text-balance sm:text-6xl lg:text-[5.5rem]">
            {a.heading}
          </h1>
          <p className="flex flex-wrap gap-x-3 gap-y-1 border-y border-ink/15 py-4 text-sm font-semibold text-ink">
            {spec.map((item, i) => (
              <span key={item} className="inline-flex items-center gap-3">
                {i > 0 && <span aria-hidden="true" className="text-ink-faint">·</span>}
                {item}
              </span>
            ))}
          </p>
        </Container>
      </section>

      {/* The dossier: pinned index on the left, five numbered sections on the right. */}
      <section className="bg-cream">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[200px_1fr] lg:gap-20">
          <nav aria-label={a.eyebrow} className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
            <ol className="flex flex-col gap-3 border-l border-ink/15 pl-5">
              {a.index.map((title, i) => (
                <li key={title}>
                  <a href={`#${ids[i]}`} className="group flex items-baseline gap-3 text-sm text-ink-soft transition-colors hover:text-ink">
                    <span className="font-extrabold tabular-nums text-indigo">0{i + 1}</span>
                    <span className="group-hover:underline">{title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col gap-24">
            {/* 01 · The question */}
            <article id="question" className="flex flex-col gap-8 scroll-mt-32">
              <Opener n={1} title={a.index[0]} />
              <p className="max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-ink text-balance sm:text-3xl">{lede}</p>
              {rest && <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">{rest}</p>}
            </article>

            {/* 02 · The people — a masthead, not cards */}
            <article id="people" className="flex flex-col gap-8 scroll-mt-32">
              <Opener n={2} title={a.index[1]} sub={a.creditsHeading} />
              <dl className="grid gap-8 sm:grid-cols-2">
                {people.map((p) => (
                  <div key={p.role} className="flex flex-col gap-1.5 border-l-2 border-indigo pl-5">
                    <dt className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-faint">{p.role}</dt>
                    <dd className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">{p.name}</dd>
                    <dd className="text-sm leading-snug text-ink-soft">{p.sub}</dd>
                  </div>
                ))}
              </dl>
            </article>

            {/* 03 · The build — the actual architecture, top to bottom */}
            <article id="build" className="flex flex-col gap-8 scroll-mt-32">
              <Opener n={3} title={a.index[2]} sub={a.builtBody} />
              <div className="flex flex-col items-stretch gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[clientA, clientB].map((c) => (
                    <div key={c.title} className="reveal rounded-2xl border border-outline bg-surface p-5">
                      <h3 className="font-bold text-ink">{c.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center py-1 text-ink-faint" aria-hidden="true"><ArrowDown size={18} /></div>
                <div className="reveal rounded-2xl border border-indigo/40 bg-indigo-tint/60 p-5">
                  <h3 className="font-bold text-ink">{inference.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{inference.body}</p>
                </div>
                <div className="flex justify-center py-1 text-ink-faint" aria-hidden="true"><ArrowDown size={18} /></div>
                <div className="reveal rounded-2xl border border-outline bg-surface p-5">
                  <h3 className="font-bold text-ink">{database.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{database.body}</p>
                </div>
              </div>
            </article>

            {/* 04 · The commitments — two SDGs as constraints */}
            <article id="commitments" className="flex flex-col gap-8 scroll-mt-32">
              <Opener n={4} title={a.index[3]} sub={a.sdgBody} />
              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  { n: 3, colour: SDG_COLOURS[3], text: a.sdg3 },
                  { n: 10, colour: SDG_COLOURS[10], text: a.sdg10 },
                ].map((s) => (
                  <div key={s.n} className="reveal flex flex-col gap-3 border-l-[6px] pl-5" style={{ borderColor: s.colour }}>
                    <span className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: s.colour }}>SDG {s.n}</span>
                    <p className="text-base leading-relaxed text-ink">{s.text}</p>
                  </div>
                ))}
              </div>
            </article>

            {/* 05 · The receipts — the numbers, and where to check them */}
            <article id="receipts" className="flex flex-col gap-8 scroll-mt-32">
              <Opener n={5} title={a.index[4]} sub={a.receiptsBody} />
              <dl className="grid gap-px overflow-hidden rounded-2xl border border-outline bg-outline sm:grid-cols-3">
                {receipts.map((r) => (
                  <div key={r.label} className="flex flex-col gap-1 bg-surface p-6">
                    <dd className="text-4xl font-extrabold tracking-tight text-ink tabular-nums">{r.value}</dd>
                    <dt className="font-bold text-ink">{r.label}</dt>
                    <dd className="text-xs leading-snug text-ink-faint">{r.detail}</dd>
                  </div>
                ))}
              </dl>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">{t.research.reproBody}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/${lang}/research`} className="inline-flex items-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-deep">
                  {t.home.statsLink}
                  <ArrowRight size={15} />
                </Link>
                <Link href={`/${lang}/contact`} className="inline-flex items-center gap-2 rounded-full border border-outline bg-surface px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-cream-alt">
                  {t.footer.contact}
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </section>
    </>
  );
}
