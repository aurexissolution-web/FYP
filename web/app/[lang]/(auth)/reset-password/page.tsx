import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { updatePassword } from "@/lib/auth/actions";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          {dict.auth.resetTitle}
        </h1>
        <p className="text-ink-soft">{dict.auth.resetSubtitle}</p>
      </div>

      <AuthForm
        action={updatePassword}
        lang={lang}
        dict={dict.auth}
        submitLabel={dict.auth.submitNewPassword}
        fields={["newPassword"]}
      />
    </div>
  );
}
