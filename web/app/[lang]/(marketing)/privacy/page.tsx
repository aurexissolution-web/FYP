import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
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
  return { title: t.footer.privacy, description: t.privacy.subheading };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const p = t.privacy;

  return (
    <Container className="py-16 sm:py-20 flex flex-col gap-12 max-w-3xl">
      <SectionHeading eyebrow={p.eyebrow} heading={p.heading} subheading={p.subheading} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-sage-tint bg-sage-tint/40 p-6 flex flex-col gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-sage-deep">
            {p.storedHeading}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {p.stored.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ink leading-relaxed">
                <Check size={16} className="text-sage-deep shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-outline/70 bg-cream-alt p-6 flex flex-col gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-faint">
            {p.notStoredHeading}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {p.notStored.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ink leading-relaxed">
                <X size={16} className="text-ink-faint shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-ink">{p.accessHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{p.accessBody}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-ink">{p.thirdPartyHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{p.thirdPartyBody}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-ink">{p.deletionHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{p.deletionBody}</p>
      </section>

      <section className="rounded-2xl bg-ink p-6 flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-cream">{p.disclaimerHeading}</h2>
        <p className="text-cream/80 leading-relaxed">{p.disclaimerBody}</p>
        <Link
          href={`/${lang}/research`}
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-sage w-fit hover:text-sage-deep"
        >
          {t.nav.research}
          <ArrowRight size={15} />
        </Link>
      </section>
    </Container>
  );
}
