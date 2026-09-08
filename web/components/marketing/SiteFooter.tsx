import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import { Container } from "./Container";

export function SiteFooter({
  lang,
  nav,
  footer,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  footer: Dictionary["footer"];
}) {
  const links = [
    { href: `/${lang}/features`, label: nav.features },
    { href: `/${lang}/how-it-works`, label: nav.howItWorks },
    { href: `/${lang}/research`, label: nav.research },
    { href: `/${lang}/about`, label: nav.about },
    { href: `/${lang}/privacy`, label: footer.privacy },
    { href: `/${lang}/contact`, label: footer.contact },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-outline/60 bg-[#f8f6f2]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1">
        <span className="w-[38%] bg-indigo" />
        <span className="w-[24%] bg-sage" />
        <span className="w-[18%] bg-amber" />
        <span className="flex-1 bg-coral" />
      </div>
      <div aria-hidden="true" className="absolute -right-8 top-2 select-none text-[9rem] font-black leading-none tracking-[-0.08em] text-indigo/[0.035] sm:text-[13rem]">
        EB
      </div>

      <Container className="relative py-10 sm:py-12">
        <div className="flex flex-col gap-9">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <Image src="/logo-icon.png" alt="" width={44} height={44} className="rounded-xl shadow-sm" />
                <div>
                  <span className="block text-2xl font-extrabold tracking-tight text-ink">EmoBuddy</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-sage-deep">NICERS&apos;26</span>
                </div>
              </div>
              <p className="max-w-xl text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
                {footer.tagline}
              </p>
            </div>

            <Link href={`/${lang}/help`} className="inline-flex w-fit items-center gap-2 rounded-full bg-coral-deep px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(184,95,79,0.2)] transition-[transform,background-color] hover:[transform:translateY(-2px)] hover:bg-coral">
              <ShieldCheck size={16} aria-hidden="true" />
              {footer.getHelp}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <nav aria-label={footer.product} className="flex flex-wrap gap-x-2 gap-y-2 border-y border-outline/70 py-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-white hover:text-indigo">
                {link.label}
                <ArrowUpRight size={13} className="opacity-35 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </Link>
            ))}
          </nav>

          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-3xl text-xs leading-relaxed text-ink-faint">{footer.disclaimer}</p>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-faint">{footer.rights}</p>
              <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-sage-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />
                EN · BM
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
