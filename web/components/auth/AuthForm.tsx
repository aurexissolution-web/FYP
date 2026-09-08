"use client";

import { useActionState } from "react";
import type { AuthState } from "@/lib/auth/actions";
import type { Dictionary, Locale } from "@/lib/dictionaries";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

const inputClass =
  "w-full rounded-xl border border-outline bg-white px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-faint transition-colors focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/30";

export function AuthForm({
  action,
  lang,
  dict,
  submitLabel,
  fields,
  children,
}: {
  action: Action;
  lang: Locale;
  dict: Dictionary["auth"];
  submitLabel: string;
  fields: Array<"email" | "password" | "newPassword">;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  const errorText = state.error
    ? (dict.errors[state.error as keyof typeof dict.errors] ?? dict.errors.generic)
    : null;
  const noticeText = state.next
    ? (dict[state.next as keyof typeof dict] as string | undefined)
    : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="lang" value={lang} />

      <div className="flex flex-col gap-4">
        {fields.includes("email") && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-ink-soft">
              {dict.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
        )}

        {fields.includes("password") && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-ink-soft">
              {dict.passwordLabel}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>
        )}

        {fields.includes("newPassword") && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-ink-soft">
              {dict.newPasswordLabel}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </div>
        )}
      </div>

      {errorText && (
        <p role="alert" className="rounded-xl bg-coral-tint px-4 py-3 text-sm font-semibold text-coral-deep">
          {errorText}
        </p>
      )}
      {noticeText && (
        <p role="status" className="rounded-xl bg-sage-tint px-4 py-3 text-sm font-semibold text-sage-deep">
          {noticeText}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-indigo px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? dict.working : submitLabel}
      </button>

      {children}
    </form>
  );
}
