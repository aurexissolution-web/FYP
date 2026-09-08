import type { Metadata } from "next";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Container";
import { SectionHeading } from "@/components/marketing/SectionHeading";

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

  return (
    <Container className="py-16 sm:py-20 flex flex-col gap-14 max-w-3xl">
      <SectionHeading eyebrow={a.eyebrow} heading={a.heading} />

      <p className="text-lg text-ink-soft leading-relaxed">{a.story}</p>

      <section className="rounded-2xl border border-outline/70 bg-surface p-6 flex flex-col gap-2">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-faint">
          {a.institutionHeading}
        </h2>
        <p className="text-ink leading-relaxed">{a.institutionBody}</p>
      </section>

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-extrabold text-ink mb-2">{a.sdgHeading}</h2>
          <p className="text-ink-soft leading-relaxed">{a.sdgBody}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-sage-tint p-5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-sage-deep">
              SDG 3
            </span>
            <p className="mt-2 text-sm text-ink leading-relaxed">{a.sdg3}</p>
          </div>
          <div className="rounded-2xl bg-amber-tint p-5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-amber">
              SDG 10
            </span>
            <p className="mt-2 text-sm text-ink leading-relaxed">{a.sdg10}</p>
          </div>
        </div>
      </section>
    </Container>
  );
}
