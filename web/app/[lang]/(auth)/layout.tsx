import Image from "next/image";
import Link from "next/link";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { LangToggle } from "@/components/shared/LangToggle";

/*
  Shared shell for login/signup/forgot-password/reset-password.

  Two panes on desktop, echoing the home hero's own text-left/visual-right
  grid so these pages read as the same product, not a bolted-on template:
  a quiet aurora + wordmark pane carries the page's one moment of warmth,
  and the form sits directly on the page's own cream — no floating white
  card competing with it. Below `lg` the aurora pane drops out entirely and
  the form becomes the whole screen.
*/
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const h = dict.home;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative isolate hidden overflow-hidden bg-cream lg:flex lg:flex-col lg:justify-between lg:p-12">
        <AuroraBackground className="absolute inset-0" intensity={0.5} />

        <Link
          href={`/${lang}`}
          className="relative z-10 flex w-fit items-center gap-2.5"
          aria-label="EmoBuddy"
        >
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
            <Image
              src="/logo-icon.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 rounded-full object-cover"
              priority
            />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            EmoBuddy
          </span>
        </Link>

        <div className="relative z-10 flex flex-col gap-5">
          <p className="max-w-sm text-2xl font-extrabold leading-snug tracking-tight text-ink text-balance">
            {h.trustLine}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sage-tint px-4 py-2 text-sm font-bold text-sage-deep">
              {h.pills[0]}
            </span>
            <span className="rounded-full bg-indigo-tint px-4 py-2 text-sm font-bold text-indigo">
              {h.pills[1]}
            </span>
            <span className="rounded-full bg-coral-tint px-4 py-2 text-sm font-bold text-coral-deep">
              {h.pills[2]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-cream">
        <div className="flex items-center justify-between p-6 sm:p-8">
          <Link
            href={`/${lang}`}
            className="flex items-center gap-2.5 lg:hidden"
            aria-label="EmoBuddy"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
              <Image
                src="/logo-icon.png"
                alt=""
                width={36}
                height={36}
                className="h-8 w-8 rounded-full object-cover"
                priority
              />
            </span>
            <span className="text-sm font-bold tracking-tight text-ink">
              EmoBuddy
            </span>
          </Link>
          <span className="hidden lg:block" />
          <LangToggle lang={lang} />
        </div>

        <main className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-8">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  );
}
