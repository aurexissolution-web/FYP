import Image from "next/image";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
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
    <div className="flex h-svh flex-col bg-[#f8f6fa]">
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-outline/50 bg-white/80 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-8">
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
          <Link href={`/${lang}/help`} className="inline-flex items-center gap-1.5 rounded-full bg-coral-tint px-3 py-2 text-xs font-bold text-coral-deep transition-colors hover:bg-coral-deep hover:text-white">
            <ShieldAlert size={14} />
            <span className="hidden sm:inline">{dict.footer.getHelp}</span>
          </Link>
          <LangToggle lang={lang} />
          <form action={`/auth/signout?lang=${lang}`} method="post">
            <button
              type="submit"
              className="rounded-full border border-outline/70 bg-white px-3.5 py-2 text-xs font-bold text-ink-faint transition-colors hover:border-coral hover:text-coral-deep"
            >
              {dict.chat.signOut}
            </button>
          </form>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <AppTabBar lang={lang} dict={dict.appNav} newChatLabel={dict.chat.newChat} />
        <main className="order-first min-h-0 flex-1 overflow-hidden lg:order-last">{children}</main>
      </div>
    </div>
  );
}
