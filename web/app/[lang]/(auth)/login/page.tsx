import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { signIn } from "@/lib/auth/actions";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div>
      <h1>{dict.auth.signInTitle}</h1>
      <p>{dict.auth.signInSubtitle}</p>
      <AuthForm
        action={signIn}
        lang={lang}
        dict={dict.auth}
        submitLabel={dict.auth.submitSignIn}
        fields={["email", "password"]}
      />
      <p>
        <Link href={`/${lang}/forgot-password`}>{dict.auth.forgotPassword}</Link>
      </p>
      <p>
        {dict.auth.noAccount}{" "}
        <Link href={`/${lang}/signup`}>{dict.nav.signUp}</Link>
      </p>
    </div>
  );
}
