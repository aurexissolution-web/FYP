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
    <div>
      <h1>{dict.auth.resetTitle}</h1>
      <p>{dict.auth.resetSubtitle}</p>
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
