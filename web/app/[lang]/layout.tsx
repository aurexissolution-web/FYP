import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, LOCALES } from "@/lib/dictionaries";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isMs = lang === "ms";
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://emobuddy.vercel.app",
    ),
    title: {
      template: "%s · EmoBuddy",
      default: isMs
        ? "EmoBuddy — Fahami Perasaan Anda"
        : "EmoBuddy — Understand How You Feel",
    },
    description: isMs
      ? "EmoBuddy ialah pendamping kesihatan mental AI dwibahasa yang membantu anda menyemak perasaan melalui suara atau teks."
      : "EmoBuddy is a bilingual AI mental health companion that helps you check in through voice or text.",
    alternates: {
      languages: { en: "/en", ms: "/ms" },
    },
    openGraph: {
      siteName: "EmoBuddy",
      locale: isMs ? "ms_MY" : "en_US",
      type: "website",
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
