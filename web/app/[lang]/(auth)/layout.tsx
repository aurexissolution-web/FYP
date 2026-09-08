import { hasLocale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <main>{children}</main>;
}
