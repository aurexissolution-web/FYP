import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, MessageCircleHeart, Plus, Sparkles } from "lucide-react";
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
  const activeDays = new Set(sessions.map((session) => new Date(session.created_at).toDateString())).size;
  const emotionsLogged = new Set(sessions.map((session) => session.fusion_result)).size;
  const stats = [
    { value: sessions.length, label: t.totalCheckIns, icon: MessageCircleHeart, tone: "bg-indigo-tint text-indigo" },
    { value: activeDays, label: t.activeDays, icon: CalendarDays, tone: "bg-sage-tint text-sage-deep" },
    { value: emotionsLogged, label: t.emotionsLogged, icon: Sparkles, tone: "bg-amber-tint text-amber" },
  ];

  return (
    <div className="relative h-full overflow-y-auto bg-[#f8f6fa]">
      <div aria-hidden="true" className="absolute -right-40 -top-32 h-96 w-96 rounded-full bg-indigo-tint/50 blur-3xl" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-deep">EmoBuddy · {t.title}</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-5xl">{t.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{t.subtitle}</p>
          </div>
          <Link href={`/${lang}/chat`} className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-16px_rgba(74,63,99,0.8)] transition-all hover:-translate-y-0.5 hover:bg-indigo-deep">
            <Plus size={16} />
            {t.startChat}
          </Link>
        </div>

        {sessions.length > 0 && (
          <dl className="grid gap-3 sm:grid-cols-3">
            {stats.map(({ value, label, icon: Icon, tone }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-white bg-white/75 p-4 shadow-[0_16px_40px_-32px_rgba(46,42,58,0.45)] ring-1 ring-outline/40 backdrop-blur-sm">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span>
                <div>
                  <dd className="text-2xl font-extrabold leading-none tabular-nums text-ink">{value}</dd>
                  <dt className="mt-1 text-xs font-semibold text-ink-faint">{label}</dt>
                </div>
              </div>
            ))}
          </dl>
        )}

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-outline/40">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-tint text-indigo"><MessageCircleHeart size={27} /></span>
            <div className="flex flex-col gap-2">
              <p className="text-xl font-extrabold text-ink">{t.emptyTitle}</p>
              <p className="text-sm text-ink-soft">{t.emptyBody}</p>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[140px_1fr]">
            <div className="hidden lg:block">
              <div className="sticky top-8 border-l border-outline pl-4 text-xs font-semibold leading-relaxed text-ink-faint">{t.subtitle}</div>
            </div>
            <div className="flex flex-col gap-8">
              {groups.map((group) => (
                <section key={group.label} className="grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div>
                    <h2 className="sticky top-6 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-faint">{group.label}</h2>
                    <span className="mt-2 block text-2xl font-extrabold text-ink/15 tabular-nums">{String(group.sessions.length).padStart(2, "0")}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.sessions.map((s) => {
                      const tint = MOOD_TINT[s.fusion_result];
                      return (
                        <Link key={s.id} href={`/${lang}/chat?session=${s.id}`} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-white bg-white/80 p-4 shadow-[0_14px_35px_-30px_rgba(46,42,58,0.5)] ring-1 ring-outline/40 transition-all hover:-translate-y-0.5 hover:border-indigo/25 hover:shadow-[0_18px_40px_-28px_rgba(74,63,99,0.45)]">
                          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${tint.bg}`}>{MOOD_EMOJI[s.fusion_result]}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-ink">{s.title ?? t.title}</span>
                            <span className="mt-1 block text-[11px] text-ink-faint">
                              {new Date(s.created_at).toLocaleString(lang === "ms" ? "ms-MY" : "en-MY", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                            </span>
                          </span>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-ink-faint transition-colors group-hover:bg-indigo group-hover:text-white"><ChevronRight size={15} /></span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
