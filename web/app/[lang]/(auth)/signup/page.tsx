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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          {dict.auth.signUpTitle}
        </h1>
        <p className="text-ink-soft">{dict.auth.signUpSubtitle}</p>
      </div>

      <AuthForm
        action={signUp}
        lang={lang}
        dict={dict.auth}
        submitLabel={dict.auth.submitSignUp}
        fields={["email", "password"]}
      />

      <p className="text-sm text-ink-faint">
        {dict.auth.hasAccount}{" "}
        <Link
          href={`/${lang}/login`}
          className="font-semibold text-indigo transition-colors hover:text-indigo-deep"
        >
          {dict.nav.signIn}
        </Link>
      </p>
    </div>
  );
}
