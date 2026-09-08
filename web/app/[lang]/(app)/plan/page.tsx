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
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{dict.plan.title}</h1>
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
