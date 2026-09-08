import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
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
  return { title: t.nav.howItWorks, description: t.howItWorks.subheading };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const h = t.howItWorks;

  return (
    <Container className="py-16 sm:py-20 flex flex-col gap-12 max-w-4xl">
      <SectionHeading
        eyebrow={h.eyebrow}
        heading={h.heading}
        subheading={h.subheading}
      />

      <ol className="flex flex-col gap-4">
        {h.steps.map((step, i) => {
          const isCrisisStep = i === 2;
          return (
            <li
              key={step.title}
              className={`relative flex gap-5 rounded-2xl border p-6 ${
                isCrisisStep
                  ? "border-coral-tint bg-coral-tint/30"
                  : "border-outline/70 bg-surface"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${
                  isCrisisStep
                    ? "bg-coral-deep text-white"
                    : "bg-indigo-tint text-indigo"
                }`}
              >
                {i + 1}
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <h3 className="text-lg font-bold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex items-start gap-4 rounded-2xl border border-coral-tint bg-coral-tint/40 p-6">
        <ShieldAlert size={24} className="text-coral-deep shrink-0 mt-0.5" />
        <p className="text-sm text-ink leading-relaxed">{h.crisisNote}</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-outline/70 bg-cream-alt p-8 text-center">
        <p className="text-sm text-ink-soft max-w-md leading-relaxed">
          {h.techNote}
        </p>
        <Link
          href={`/${lang}/research`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo hover:text-indigo-deep"
        >
          {t.nav.research}
          <ArrowRight size={15} />
        </Link>
      </div>
    </Container>
  );
}
