import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { LangToggle } from "@/components/shared/LangToggle";
import { AppTabBar } from "@/components/app/AppTabBar";

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

  const dict = await getDictionary(lang);

  return (
    <div className="flex h-svh flex-col bg-cream">
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-outline/60 bg-cream/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Link href={`/${lang}/chat`} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
            <Image
              src="/logo-icon.png"
              alt=""
              width={32}
              height={32}
              className="h-7 w-7 rounded-full object-cover"
              priority
            />
          </span>
          <span className="text-sm font-bold tracking-tight text-ink">EmoBuddy</span>
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} />
          <form action={`/auth/signout?lang=${lang}`} method="post">
            <button
              type="submit"
              className="rounded-full border border-outline px-3 py-1.5 text-xs font-bold text-ink-faint transition-colors hover:border-coral hover:text-coral-deep"
            >
              {dict.chat.signOut}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">{children}</main>

      <AppTabBar lang={lang} dict={dict.appNav} />
    </div>
  );
}
