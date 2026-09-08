import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { signUp } from "@/lib/auth/actions";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div>
      <h1>{dict.auth.signUpTitle}</h1>
      <p>{dict.auth.signUpSubtitle}</p>
      <AuthForm
        action={signUp}
        lang={lang}
        dict={dict.auth}
        submitLabel={dict.auth.submitSignUp}
        fields={["email", "password"]}
      />
      <p>
        {dict.auth.hasAccount}{" "}
        <Link href={`/${lang}/login`}>{dict.nav.signIn}</Link>
      </p>
    </div>
  );
}
