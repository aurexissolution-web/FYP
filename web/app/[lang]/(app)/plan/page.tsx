import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { requireUser } from "@/lib/api/auth";
import { fetchMoodLogs } from "@/lib/chat/sessions";
import { PlanClient } from "@/components/plan/PlanClient";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const user = await requireUser();
  const logs = user ? await fetchMoodLogs(user.id) : [];

  return (
    <div className="relative h-full overflow-y-auto bg-[#f8f6fa]">
      <div aria-hidden="true" className="absolute -right-36 -top-28 h-96 w-96 rounded-full bg-sage-tint/55 blur-3xl" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-deep">EmoBuddy · 03 Days</span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-5xl">{dict.plan.title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{dict.plan.subtitle}</p>
        </div>
        <PlanClient
          lang={lang}
          dict={dict.plan}
          dayLabel={dict.chat.dayLabel}
          initialLogs={logs}
        />
      </div>
    </div>
  );
}
