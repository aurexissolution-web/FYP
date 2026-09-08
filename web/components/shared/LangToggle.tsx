"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/dictionaries";

// Same swap-the-locale-segment logic as SiteNav's toggle, so the pattern
// reads identically on the marketing site, the auth pages, and the chat page.
export function LangToggle({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(en|ms)/, "") || "/";
  const otherLang = lang === "en" ? "ms" : "en";
  const otherHref = `/${otherLang}${rest === "/" ? "" : rest}`;

  return (
    <Link
      href={otherHref}
      className="rounded-full border border-outline px-3 py-1.5 text-xs font-bold tracking-wide text-ink-faint transition-colors hover:border-indigo hover:text-indigo"
    >
      {otherLang === "en" ? "EN" : "BM"}
    </Link>
  );
}
