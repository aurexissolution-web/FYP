import type { Metadata } from "next";
import { Phone, AlertOctagon, Check, X } from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { getHotlines } from "@/lib/hotlines";
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
  return { title: t.footer.getHelp, description: t.help.subheading };
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const h = t.help;
  const hotlines = getHotlines(lang);

  return (
    <Container className="py-16 sm:py-20 flex flex-col gap-10 max-w-3xl">
      <SectionHeading eyebrow={h.eyebrow} heading={h.heading} subheading={h.subheading} />

      <div className="flex items-center gap-3 rounded-2xl bg-coral-deep px-6 py-4">
        <AlertOctagon size={22} className="text-white shrink-0" />
        <p className="text-sm font-bold text-white">{h.emergencyBanner}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-faint">
          {h.hotlinesHeading}
        </h2>
        <div className="flex flex-col gap-3">
          {hotlines.map((line) => (
            <a
              key={line.name}
              href={line.telHref}
              className="flex items-center gap-4 rounded-2xl border border-outline/70 bg-surface p-5 hover:border-indigo transition-colors group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-tint text-sage-deep">
                <Phone size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <h3 className="font-extrabold text-ink">{line.name}</h3>
                  <span className="font-mono text-lg font-bold text-indigo group-hover:text-indigo-deep">
                    {line.phone}
                  </span>
                </div>
                <p className="text-sm text-ink-soft leading-snug mt-0.5">
                  {line.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-ink">{h.expectHeading}</h2>
        <p className="text-ink-soft leading-relaxed">{h.expectBody}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-sage-tint bg-sage-tint/40 p-6 flex flex-col gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-sage-deep">
            {h.emoBuddyDoesHeading}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {h.emoBuddyDoes.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ink leading-relaxed">
                <Check size={16} className="text-sage-deep shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-outline/70 bg-cream-alt p-6 flex flex-col gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-faint">
            {h.emoBuddyDoesNotHeading}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {h.emoBuddyDoesNot.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ink leading-relaxed">
                <X size={16} className="text-ink-faint shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
