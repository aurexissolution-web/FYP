"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/dictionaries";

export function SiteNav({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["nav"];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const rest = pathname.replace(/^\/(en|ms)/, "") || "/";
  const otherLang = lang === "en" ? "ms" : "en";
  const otherHref = `/${otherLang}${rest === "/" ? "" : rest}`;

  const links = [
    { href: `/${lang}`, label: dict.home },
    { href: `/${lang}/features`, label: dict.features },
    { href: `/${lang}/how-it-works`, label: dict.howItWorks },
    { href: `/${lang}/research`, label: dict.research },
    { href: `/${lang}/about`, label: dict.about },
  ];

  const isActive = (href: string) =>
    href === `/${lang}` ? pathname === href : pathname.startsWith(href);

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 sm:pt-5">
      <header className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between gap-3 rounded-full bg-ink py-2 pl-2 pr-2 shadow-[0_10px_35px_-10px_rgba(46,42,58,0.45)]">
          {/* Brand */}
          <Link
            href={`/${lang}`}
            className="flex shrink-0 items-center gap-2.5 pr-2"
            aria-label="EmoBuddy"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
              <Image
                src="/logo-icon.png"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 rounded-full object-cover"
                priority
              />
            </span>
            <span className="hidden text-[15px] font-bold tracking-tight text-white sm:block">
              EmoBuddy
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive(l.href)
                    ? "bg-white/18 font-semibold text-white"
                    : "font-medium text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href={otherHref}
              className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-bold tracking-wide text-white/85 transition-colors hover:border-white/60 hover:text-white"
            >
              {otherLang === "en" ? "EN" : "BM"}
            </Link>
            <Link
              href={`/${lang}/login`}
              className="rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
            >
              {dict.signIn}
            </Link>
            <Link
              href={`/${lang}/signup`}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-deep transition-colors hover:bg-cream"
            >
              {dict.signUp}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={dict.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <nav className="mt-2 flex flex-col gap-1 rounded-3xl bg-ink p-3 shadow-[0_10px_35px_-10px_rgba(46,42,58,0.45)] lg:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-3 text-[15px] transition-colors ${
                  isActive(l.href)
                    ? "bg-white/18 font-semibold text-white"
                    : "font-medium text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3">
              <Link
                href={otherHref}
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white/70"
              >
                {otherLang === "en" ? "EN" : "BM"}
              </Link>
              <Link
                href={`/${lang}/login`}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full px-4 py-2.5 text-center text-sm font-medium text-white/80"
              >
                {dict.signIn}
              </Link>
              <Link
                href={`/${lang}/signup`}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-indigo-deep"
              >
                {dict.signUp}
              </Link>
            </div>
          </nav>
        )}
      </header>
    </div>
  );
}
