"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Verified 2026-09-08 against GET /auth/v1/settings on this project:
// `mailer_autoconfirm: false` — email confirmation IS enabled, so signUp
// returns no session and the user must click a link before they can sign in.
// The `confirmEmail` branch below is therefore the live path, not a fallback.
// If confirmation is later turned off in the Supabase dashboard, signUp
// returns a session and the redirect to /chat takes over with no code change.

export type AuthState = { error?: string; ok?: boolean; next?: string };

const isLocale = (v: unknown): v is "en" | "ms" => v === "en" || v === "ms";

function readForm(formData: FormData) {
  const lang = formData.get("lang");
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    lang: isLocale(lang) ? lang : ("en" as const),
  };
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password, lang } = readForm(formData);
  if (!email || !password) return { error: "missingFields" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(`/${lang}/chat`);
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password, lang } = readForm(formData);
  if (!email || !password) return { error: "missingFields" };
  if (password.length < 6) return { error: "passwordTooShort" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/${lang}/chat` },
  });
  if (error) return { error: error.message };

  // No session means confirmation is required — tell them to check their
  // inbox rather than bouncing them to a chat page they cannot use yet.
  if (!data.session) return { ok: true, next: "confirmEmail" };

  redirect(`/${lang}/chat`);
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, lang } = readForm(formData);
  if (!email) return { error: "missingFields" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/${lang}/reset-password`,
  });
  if (error) return { error: error.message };

  return { ok: true, next: "checkInbox" };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { password, lang } = readForm(formData);
  if (password.length < 6) return { error: "passwordTooShort" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect(`/${lang}/chat`);
}
