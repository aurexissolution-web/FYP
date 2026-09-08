import { notFound } from "next/navigation";
import { Activity, CheckCircle2, Flame, LogOut, Phone, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { getHotlines } from "@/lib/hotlines";
import { requireUser } from "@/lib/api/auth";
import { fetchMoodLogs } from "@/lib/chat/sessions";
import { getEmergencyContact } from "@/lib/chat/emergency";
import { EmergencyContactClient } from "@/components/profile/EmergencyContactClient";

/** Consecutive-day streak ending today, from a session's own local clock —
 * mirrors the day-bucketing app/lib/pages/profile_page.dart does client-side. */
function computeStreak(createdAtValues: string[]): number {
  const days = new Set(createdAtValues.map((c) => new Date(c).toDateString()));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.profile;
  const hotlines = getHotlines(lang);

  const user = await requireUser();
  const logs = user ? await fetchMoodLogs(user.id) : [];
  const contact = user ? await getEmergencyContact(user.id) : null;

  const checkins = logs.length;
  const completed = logs.reduce(
    (sum, log) => sum + log.self_care_plans.filter((p) => p.completed_at).length,
    0,
  );
  const streak = computeStreak(logs.map((l) => l.created_at));

  const stats = [
    { value: streak, label: t.statStreak, icon: Flame, tone: "bg-coral-tint text-coral-deep" },
    { value: checkins, label: t.statCheckins, icon: Activity, tone: "bg-indigo-tint text-indigo" },
    { value: completed, label: t.statCompleted, icon: CheckCircle2, tone: "bg-sage-tint text-sage-deep" },
  ];

  return (
    <div className="relative h-full overflow-y-auto bg-[#f8f6fa]">
      <div aria-hidden="true" className="absolute -right-36 -top-28 h-96 w-96 rounded-full bg-indigo-tint/55 blur-3xl" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-deep">EmoBuddy · {t.accountLabel}</span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-5xl">{t.title}</h1>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col gap-5">
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-deep via-indigo to-[#8a75a8] p-7 text-white shadow-[0_28px_65px_-35px_rgba(74,63,99,0.75)] sm:p-8">
              <div aria-hidden="true" className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[45px] border-white/10" />
              <div className="relative flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/12 backdrop-blur-sm"><User size={26} /></span>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/55">{t.accountLabel}</span>
                  <p className="mt-1 truncate text-base font-bold">{user?.email ?? "—"}</p>
                </div>
              </div>
              <div className="relative mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs font-semibold text-white/65">
                <ShieldCheck size={15} />
                {dict.emergencyContact.subtitle}
              </div>
            </section>

            <dl className="grid grid-cols-3 gap-3">
              {stats.map(({ value, label, icon: Icon, tone }) => (
                <div key={label} className="flex min-h-32 flex-col justify-between rounded-2xl border border-white bg-white/75 p-4 shadow-[0_14px_35px_-30px_rgba(46,42,58,0.5)] ring-1 ring-outline/40">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={16} /></span>
                  <div>
                    <dd className="text-2xl font-extrabold tabular-nums text-ink">{value}</dd>
                    <dt className="mt-1 text-[11px] leading-tight text-ink-faint">{label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-5">
            <EmergencyContactClient dict={dict.emergencyContact} initialContact={contact} />

            <section className="overflow-hidden rounded-[2rem] border border-coral/25 bg-coral-tint/45 shadow-[0_20px_50px_-38px_rgba(184,95,79,0.55)]">
              <div className="flex items-start gap-4 border-b border-coral/20 px-6 py-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-coral-deep text-white"><ShieldAlert size={19} /></span>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-ink">{dict.help.hotlinesHeading}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{dict.help.subheading}</p>
                </div>
              </div>
              <div className="grid gap-px bg-coral/15 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {hotlines.map((hotline) => (
                  <a key={hotline.name} href={hotline.telHref} className="group flex items-center gap-3 bg-white/65 px-4 py-4 transition-colors hover:bg-white">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-coral-tint text-coral-deep"><Phone size={15} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-ink">{hotline.name}</span>
                      <span className="mt-0.5 block font-mono text-sm font-extrabold text-coral-deep">{hotline.phone}</span>
                    </span>
                  </a>
                ))}
              </div>
              <p className="bg-coral-deep px-5 py-3 text-center text-xs font-bold text-white">{dict.help.emergencyBanner}</p>
            </section>

            <form action={`/auth/signout?lang=${lang}`} method="post">
              <button type="submit" className="group flex w-full items-center justify-between rounded-2xl border border-coral/20 bg-white/70 px-5 py-4 text-sm font-bold text-coral-deep transition-all hover:border-coral/40 hover:bg-coral-tint/50">
                {dict.chat.signOut}
                <span className="grid h-8 w-8 place-items-center rounded-full bg-coral-tint transition-colors group-hover:bg-white"><LogOut size={14} /></span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
