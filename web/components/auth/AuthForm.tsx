"use client";

import { useActionState } from "react";
import type { AuthState } from "@/lib/auth/actions";
import type { Dictionary, Locale } from "@/lib/dictionaries";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

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
    <form action={formAction}>
      <input type="hidden" name="lang" value={lang} />

      {fields.includes("email") && (
        <p>
          <label htmlFor="email">{dict.emailLabel}</label>
          <br />
          <input id="email" name="email" type="email" autoComplete="email" required />
        </p>
      )}

      {fields.includes("password") && (
        <p>
          <label htmlFor="password">{dict.passwordLabel}</label>
          <br />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </p>
      )}

      {fields.includes("newPassword") && (
        <p>
          <label htmlFor="password">{dict.newPasswordLabel}</label>
          <br />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </p>
      )}

      {errorText && <p role="alert">{errorText}</p>}
      {noticeText && <p role="status">{noticeText}</p>}

      <button type="submit" disabled={pending}>
        {pending ? dict.working : submitLabel}
      </button>

      {children}
    </form>
  );
}
