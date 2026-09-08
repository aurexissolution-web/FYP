import type { Metadata } from "next";
import {
  Languages,
  Mic,
  Scale,
  ListChecks,
  ShieldAlert,
  History,
  MicOff,
} from "lucide-react";
import { getDictionary, hasLocale, type Locale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Container";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { FeatureCard } from "@/components/marketing/FeatureCard";

const ICONS = [Languages, Mic, Scale, ListChecks, ShieldAlert, History, MicOff];
const TINTS = ["indigo", "sage", "coral", "amber", "coral", "indigo", "sage"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.nav.features, description: t.features.subheading };
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const t = await getDictionary(lang);
  const f = t.features;

  return (
    <Container className="py-16 sm:py-20 flex flex-col gap-12">
      <SectionHeading
        eyebrow={f.eyebrow}
        heading={f.heading}
        subheading={f.subheading}
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {f.items.map((item, i) => (
          <FeatureCard
            key={item.title}
            icon={ICONS[i]}
            tint={TINTS[i]}
            title={item.title}
            body={item.body}
          />
        ))}
      </div>
    </Container>
  );
}
