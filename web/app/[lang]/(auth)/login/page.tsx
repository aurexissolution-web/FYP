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
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-deep">EmoBuddy</span>
        <h1 className="text-4xl font-extrabold leading-none tracking-[-0.04em] text-ink">
          {dict.auth.signInTitle}
        </h1>
        <p className="text-sm leading-relaxed text-ink-soft">{dict.auth.signInSubtitle}</p>
      </div>

      <AuthForm
        action={signIn}
        lang={lang}
        dict={dict.auth}
        submitLabel={dict.auth.submitSignIn}
        fields={["email", "password"]}
      />

      <div className="flex flex-col gap-3 border-t border-outline/60 pt-5 text-sm">
        <Link
          href={`/${lang}/forgot-password`}
          className="font-semibold text-indigo transition-colors hover:text-indigo-deep"
        >
          {dict.auth.forgotPassword}
        </Link>
        <p className="text-ink-faint">
          {dict.auth.noAccount}{" "}
          <Link
            href={`/${lang}/signup`}
            className="font-semibold text-indigo transition-colors hover:text-indigo-deep"
          >
            {dict.nav.signUp}
          </Link>
        </p>
      </div>
    </div>
  );
}
