import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-full flex-col">
      <SiteNav lang={lang} dict={dict.nav} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} nav={dict.nav} footer={dict.footer} />
    </div>
  );
}
