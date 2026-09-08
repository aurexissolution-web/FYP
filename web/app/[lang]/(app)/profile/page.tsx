import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
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
    { value: streak, label: t.statStreak },
    { value: checkins, label: t.statCheckins },
    { value: completed, label: t.statCompleted },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t.title}</h1>

        <div className="flex items-center gap-4 rounded-2xl border border-outline/70 bg-white p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-tint text-indigo">
            <User size={24} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink-faint">
              {t.accountLabel}
            </span>
            <span className="text-sm font-semibold text-ink">{user?.email ?? "—"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-outline/70 bg-white py-5 text-center"
            >
              <span className="text-2xl font-extrabold tabular-nums text-indigo">{s.value}</span>
              <span className="text-xs text-ink-faint">{s.label}</span>
            </div>
          ))}
        </div>

        <EmergencyContactClient dict={dict.emergencyContact} initialContact={contact} />

        <form action={`/auth/signout?lang=${lang}`} method="post">
          <button
            type="submit"
            className="w-full rounded-full border border-outline px-5 py-3 text-sm font-bold text-coral-deep transition-colors hover:border-coral hover:bg-coral-tint"
          >
            {dict.chat.signOut}
          </button>
        </form>
      </div>
    </div>
  );
}
