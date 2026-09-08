import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageCircleHeart } from "lucide-react";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { requireUser } from "@/lib/api/auth";
import { listSessions } from "@/lib/chat/sessions";
import type { SessionRow } from "@/lib/chat/types";
import { MOOD_EMOJI, MOOD_TINT } from "@/lib/mood";

function groupSessions(
  sessions: SessionRow[],
  labels: { today: string; yesterday: string; thisWeek: string; earlier: string },
) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: { label: string; sessions: SessionRow[] }[] = [
    { label: labels.today, sessions: [] },
    { label: labels.yesterday, sessions: [] },
    { label: labels.thisWeek, sessions: [] },
    { label: labels.earlier, sessions: [] },
  ];

  for (const s of sessions) {
    const created = new Date(s.created_at);
    if (created >= startOfToday) groups[0].sessions.push(s);
    else if (created >= startOfYesterday) groups[1].sessions.push(s);
    else if (created >= startOfWeek) groups[2].sessions.push(s);
    else groups[3].sessions.push(s);
  }

  return groups.filter((g) => g.sessions.length > 0);
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.history;

  const user = await requireUser();
  const sessions = user ? await listSessions(user.id) : [];
  const groups = groupSessions(sessions, {
    today: t.groupToday,
    yesterday: t.groupYesterday,
    thisWeek: t.groupThisWeek,
    earlier: t.groupEarlier,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t.title}</h1>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-outline/70 bg-white px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-tint text-indigo">
              <MessageCircleHeart size={22} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-ink">{t.emptyTitle}</p>
              <p className="text-sm text-ink-soft">{t.emptyBody}</p>
            </div>
            <Link
              href={`/${lang}/chat`}
              className="rounded-full bg-indigo px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-deep"
            >
              {t.startChat}
            </Link>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-faint">
                {group.label}
              </h2>
              <div className="flex flex-col gap-2">
                {group.sessions.map((s) => {
                  const tint = MOOD_TINT[s.fusion_result];
                  return (
                    <Link
                      key={s.id}
                      href={`/${lang}/chat?session=${s.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-outline/70 bg-white px-4 py-3 transition-colors hover:border-indigo/40"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${tint.bg}`}
                      >
                        {MOOD_EMOJI[s.fusion_result]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">
                          {s.title ?? t.title}
                        </span>
                        <span className="block text-xs text-ink-faint">
                          {new Date(s.created_at).toLocaleString(lang === "ms" ? "ms-MY" : "en-MY", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-ink-faint" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
