import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { requestPasswordReset } from "@/lib/auth/actions";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div>
      <h1>{dict.auth.forgotTitle}</h1>
      <p>{dict.auth.forgotSubtitle}</p>
      <AuthForm
        action={requestPasswordReset}
        lang={lang}
        dict={dict.auth}
        submitLabel={dict.auth.submitReset}
        fields={["email"]}
      />
      <p>
        <Link href={`/${lang}/login`}>{dict.nav.signIn}</Link>
      </p>
    </div>
  );
}
