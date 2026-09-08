"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Leaf, MessageCircle, Plus, User } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/dictionaries";

// Mirrors the Flutter app's four-tab bottom nav (main_shell.dart: Chat,
// History, Plan, Profile) so the website and the app share one navigation
// model, not two different ones.
export function AppTabBar({
  lang,
  dict,
  newChatLabel,
}: {
  lang: Locale;
  dict: Dictionary["appNav"];
  newChatLabel: string;
}) {
  const pathname = usePathname();

  const tabs = [
    { href: `/${lang}/chat`, label: dict.chat, icon: MessageCircle },
    { href: `/${lang}/history`, label: dict.history, icon: Clock },
    { href: `/${lang}/plan`, label: dict.plan, icon: Leaf },
    { href: `/${lang}/profile`, label: dict.profile, icon: User },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="relative z-20 flex shrink-0 items-center justify-around border-t border-outline/50 bg-white/90 px-2 py-2.5 backdrop-blur-xl sm:justify-center sm:gap-2 lg:w-60 lg:flex-col lg:items-stretch lg:justify-start lg:gap-2 lg:border-r lg:border-t-0 lg:bg-white/70 lg:p-5"
      aria-label={`${dict.chat}, ${dict.history}, ${dict.plan}, ${dict.profile}`}
    >
      <Link href={`/${lang}/chat`} className="mb-3 hidden w-full items-center justify-center gap-2 rounded-xl bg-indigo px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(74,63,99,0.75)] transition-all hover:-translate-y-0.5 hover:bg-indigo-deep lg:flex">
        <Plus size={16} />
        {newChatLabel}
      </Link>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-bold transition-all sm:flex-none sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-5 sm:py-2.5 sm:text-sm lg:w-full lg:justify-start lg:rounded-xl lg:px-4 lg:py-3 ${
              active
                ? "bg-indigo text-white shadow-[0_8px_20px_-12px_rgba(74,63,99,0.8)]"
                : "text-ink-faint hover:bg-cream hover:text-ink-soft"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} className="sm:hidden" />
            <Icon size={16} className="hidden sm:block" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
