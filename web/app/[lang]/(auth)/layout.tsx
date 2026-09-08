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
    <div className="grid min-h-svh bg-[#faf9fc] lg:grid-cols-[1.08fr_0.92fr]">
      <div className="relative isolate hidden overflow-hidden bg-cream lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <AuroraBackground className="absolute inset-0" intensity={0.72} />
        <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-35 [mask-image:linear-gradient(135deg,black,transparent_75%)]" />
        <div aria-hidden="true" className="absolute -bottom-36 -right-28 h-[30rem] w-[30rem] rounded-full border-[80px] border-white/30" />

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

        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sage-deep">{h.badge}</span>
          <h2 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] text-ink text-balance xl:text-6xl">{h.title}</h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft">{h.subtitle}</p>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <p className="text-sm font-bold text-ink">{h.trustLine}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-sage/20 bg-white/65 px-4 py-2 text-xs font-bold text-sage-deep backdrop-blur-sm">{h.pills[0]}</span>
            <span className="rounded-full border border-indigo/15 bg-white/65 px-4 py-2 text-xs font-bold text-indigo backdrop-blur-sm">{h.pills[1]}</span>
            <span className="rounded-full border border-coral/20 bg-white/65 px-4 py-2 text-xs font-bold text-coral-deep backdrop-blur-sm">{h.pills[2]}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-[#faf9fc]">
        <div className="flex items-center justify-between p-6 sm:p-8 lg:px-10 lg:py-8">
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

        <main className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-8 lg:px-12">
          <div className="w-full max-w-md rounded-[2rem] border border-white bg-white/80 p-7 shadow-[0_30px_80px_-42px_rgba(74,63,99,0.35)] ring-1 ring-indigo/5 backdrop-blur-sm sm:p-9">{children}</div>
        </main>
      </div>
    </div>
  );
}
