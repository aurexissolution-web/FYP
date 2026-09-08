import type { Metadata } from "next";
import { Mail, Code2, Building2 } from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Container";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const CONTACT_EMAIL = "aurexissolution@gmail.com";
const GITHUB_URL = "https://github.com/aurexissolution-web/FYP";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.footer.contact, description: t.contact.body };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const c = t.contact;

  return (
    <Container className="py-16 sm:py-20 flex flex-col gap-10 max-w-2xl">
      <SectionHeading eyebrow={c.eyebrow} heading={c.heading} subheading={c.body} />

      <div className="flex flex-col gap-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-4 rounded-2xl border border-outline/70 bg-surface p-5 hover:border-indigo transition-colors"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-tint text-indigo">
            <Mail size={20} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              {c.emailLabel}
            </span>
            <p className="font-semibold text-ink">{CONTACT_EMAIL}</p>
          </div>
        </a>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-4 rounded-2xl border border-outline/70 bg-surface p-5 hover:border-indigo transition-colors"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-alt text-ink-soft">
            <Code2 size={20} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              {c.githubLabel}
            </span>
            <p className="font-semibold text-ink">github.com/aurexissolution-web/FYP</p>
          </div>
        </a>

        <div className="flex items-center gap-4 rounded-2xl border border-outline/70 bg-cream-alt p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-tint text-sage-deep">
            <Building2 size={20} />
          </div>
          <p className="text-sm text-ink-soft leading-snug">{c.institutionLabel}</p>
        </div>
      </div>
    </Container>
  );
}
