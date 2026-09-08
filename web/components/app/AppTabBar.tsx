"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Leaf, MessageCircle, User } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/dictionaries";

// Mirrors the Flutter app's four-tab bottom nav (main_shell.dart: Chat,
// History, Plan, Profile) so the website and the app share one navigation
// model, not two different ones.
export function AppTabBar({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["appNav"];
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
      className="flex shrink-0 items-center justify-around border-t border-outline/60 bg-white px-2 py-2 sm:justify-center sm:gap-2"
      aria-label={`${dict.chat}, ${dict.history}, ${dict.plan}, ${dict.profile}`}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-bold transition-colors sm:flex-none sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-4 sm:py-2 sm:text-sm ${
              active
                ? "bg-indigo-tint text-indigo"
                : "text-ink-faint hover:text-ink-soft"
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
