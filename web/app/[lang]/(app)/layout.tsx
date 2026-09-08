import { notFound, redirect } from "next/navigation";
import { hasLocale } from "@/lib/dictionaries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  // The guard lives here, not only in proxy.ts, so a proxy misconfiguration
  // cannot silently expose the route.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login`);

  return <main>{children}</main>;
}
