# Web Auth + Chat Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `emobuddy/web` working Supabase email/password authentication and a persisted, bilingual chatbot backed by the already-deployed `ml-service`, with unstyled pages the user will restyle later.

**Architecture:** All database writes and all `ml-service` calls happen server-side inside Next.js route handlers, so the chat UI is a thin `fetch()` + render layer. Supabase row-level security is enforced by using the request-scoped server client carrying the user's JWT — no service-role key is introduced. `proxy.ts` gains session refresh alongside its existing locale redirect.

**Tech Stack:** Next.js 16.3.4 (App Router, `proxy.ts` file convention), React 19.2.8, TypeScript 5, Tailwind v4, `@supabase/ssr` 0.12.6, `@supabase/supabase-js` 2.115.0, FastAPI `ml-service` on Render.

**Spec:** `docs/superpowers/specs/2026-09-08-web-auth-chat-backend-design.md`

## Global Constraints

- Work only inside `emobuddy/web`. Do not modify `app/` (Flutter) or `ml-service/`.
- Do not modify anything under `app/[lang]/(marketing)/**` or `components/marketing/**`. Those are the user's design territory.
- Pages created by this plan are **deliberately unstyled**. Use plain semantic HTML with at most the existing `bg-cream` / `text-ink` tokens. Do not design them. The user restyles them; restyling must never require touching logic.
- Never introduce `SUPABASE_SERVICE_ROLE_KEY`. Every database access runs through the user's JWT under RLS.
- Never call `ml-service` from the browser. `ML_SERVICE_URL` is server-only (no `NEXT_PUBLIC_` prefix) and must stay that way.
- `@supabase/ssr` 0.12.6: use only the `getAll` / `setAll` cookie methods. The `get` / `set` / `remove` form is deprecated and must not be used.
- `setAll(cookiesToSet, headers)` takes a **second `headers` argument**. Those headers must be written onto the response — skipping them lets a CDN serve one user's session token to another user.
- Create a new Supabase server client per request. Never share one across requests.
- Next.js 16: `cookies()` is async — `const cookieStore = await cookies()`.
- All user-facing copy goes in `lib/dictionaries/{en,ms}.ts` behind a type in `types.ts`. No hardcoded English in a page.
- Path alias is `@/*` → `./*` (see `tsconfig.json`).
- Emotion labels are exactly `happy | sad | angry | neutral`. Languages are exactly `en | ms`.
- `web/` is currently untracked in git. Task 1 handles the initial commit; do not `git add` the whole repo root.

## Testing Reality — read before Task 1

`web/` has **no test framework**, and the spec puts adding one out of scope. This repo's established pattern is standalone verification scripts (`ml-service/scripts/test_fusion.py`, `ml-service/scripts/run_eval.py`).

So the red-green cycle in this plan is: **write a concrete runnable check, run it and watch it fail for the right reason, implement, run it again and watch it pass.** The checks are `curl` invocations, `npx tsc --noEmit`, and a Node script. They are real commands with real expected output — not a stand-in for tests.

A dev server on port 3003 is assumed throughout: `npm run dev -- -p 3003` from `web/`.

---

### Task 1: Supabase client factories and session refresh in proxy

This is the foundation and carries the two hazards called out in the spec. Everything else depends on it.

**Files:**
- Create: `web/lib/supabase/server.ts`
- Create: `web/lib/supabase/client.ts`
- Create: `web/lib/supabase/proxy.ts`
- Modify: `web/proxy.ts` (whole file — currently locale redirect only)

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE` from `@/lib/dictionaries` (already exists).
- Produces:
  - `createClient(): Promise<SupabaseClient>` from `@/lib/supabase/server` — async, request-scoped, for Server Components and Route Handlers.
  - `createClient(): SupabaseClient` from `@/lib/supabase/client` — browser, synchronous.
  - `updateSession(request: NextRequest): Promise<NextResponse>` from `@/lib/supabase/proxy`.

- [ ] **Step 1: Write the failing check**

Create `web/scripts/check-proxy-routing.sh`:

```bash
#!/usr/bin/env bash
# Verifies the two proxy.ts hazards from the spec:
#   1. /auth/callback must NOT be locale-prefixed
#   2. a locale redirect must still carry Set-Cookie through
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0

echo "--- /auth/callback must not redirect to /en/auth/callback ---"
loc=$(curl -s -o /dev/null -D - "$BASE/auth/callback" | grep -i '^location:' | tr -d '\r')
echo "location: ${loc:-<none>}"
case "$loc" in
  *"/en/auth/callback"*) echo "FAIL: callback was locale-prefixed"; fail=1 ;;
  *) echo "PASS: callback not locale-prefixed" ;;
esac

echo "--- /features must redirect to /en/features ---"
loc=$(curl -s -o /dev/null -D - "$BASE/features" | grep -i '^location:' | tr -d '\r')
echo "location: ${loc:-<none>}"
case "$loc" in
  *"/en/features"*) echo "PASS: locale redirect intact" ;;
  *) echo "FAIL: locale redirect broken"; fail=1 ;;
esac

exit $fail
```

Make it executable: `chmod +x web/scripts/check-proxy-routing.sh`

- [ ] **Step 2: Run it to verify it fails**

Start the dev server (`npm run dev -- -p 3003`), then:

Run: `./scripts/check-proxy-routing.sh`
Expected: **FAIL** on the first check — the current matcher `/((?!_next|api|.*\..*).*)` matches `/auth/callback` and rewrites it to `/en/auth/callback`. The second check passes already.

- [ ] **Step 3: Write the server client**

`web/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Request-scoped Supabase client for Server Components and Route Handlers.
 * A new client per request — never share one across requests, or a later
 * response can be left without the required no-cache headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // proxy.ts refreshes the session on navigations, so this is safe
            // to swallow here — see lib/supabase/proxy.ts.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Write the browser client**

`web/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 5: Write the session refresher**

`web/lib/supabase/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session and returns a response carrying any
 * rewritten auth cookies. Call this before any redirect logic, and copy the
 * cookies forward if you replace the response — see proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Required: without these a CDN can cache one user's session
          // cookie and serve it to someone else.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Touching getUser() is what triggers the refresh. Do not remove.
  await supabase.auth.getUser();

  return response;
}
```

- [ ] **Step 6: Rewrite proxy.ts to run refresh before the locale rule**

Replace the whole of `web/proxy.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/dictionaries";
import { updateSession } from "@/lib/supabase/proxy";

// Renamed from `middleware` in this Next.js version — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
export async function proxy(request: NextRequest) {
  // Refresh first, so both branches below carry a fresh session.
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (pathnameHasLocale) return response;

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  const redirect = NextResponse.redirect(url);

  // A fresh redirect response would otherwise drop the refreshed auth
  // cookies, signing users out at random on locale-redirected URLs.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }

  return redirect;
}

export const config = {
  // Skip static assets, images, API routes, the auth callback, and files with
  // an extension. `auth` MUST stay excluded: locale-prefixing /auth/callback
  // breaks every email confirmation and password reset link.
  matcher: ["/((?!_next|api|auth|.*\\..*).*)"],
};
```

- [ ] **Step 7: Run the check to verify it passes**

Run: `./scripts/check-proxy-routing.sh`
Expected: **PASS** on both checks. `/auth/callback` returns 404 (the route does not exist yet — that is correct at this stage) with no `Location` header pointing at `/en/auth/callback`; `/features` still redirects to `/en/features`.

- [ ] **Step 8: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Verify the marketing site still renders**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003/en`
Expected: `200`. The home page must be unaffected.

- [ ] **Step 10: Commit**

```bash
cd /Users/sanjaygunabalan2626gmail.com/Documents/FYP/emobuddy
git checkout -b web-auth-chat
git add web/
git commit -m "Add Supabase clients and session refresh to the web proxy

web/ was previously untracked. This commits the existing Next.js
marketing site alongside the new Supabase client factories.

proxy.ts now refreshes the session before applying the locale rule,
copies auth cookies onto the locale redirect (they were being dropped),
and excludes /auth from the matcher so callback links are not
locale-prefixed."
```

---

### Task 2: Auth actions and the callback route

**Files:**
- Create: `web/lib/auth/actions.ts`
- Create: `web/app/auth/callback/route.ts`
- Create: `web/app/auth/signout/route.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 1).
- Produces, all Server Actions returning `{ error: string } | { ok: true; next?: string }`:
  - `signIn(prevState: AuthState, formData: FormData): Promise<AuthState>`
  - `signUp(prevState: AuthState, formData: FormData): Promise<AuthState>`
  - `requestPasswordReset(prevState: AuthState, formData: FormData): Promise<AuthState>`
  - `updatePassword(prevState: AuthState, formData: FormData): Promise<AuthState>`
  - `type AuthState = { error?: string; ok?: boolean; next?: string }`

  Each reads `lang` from `formData` (hidden input) to build locale-correct redirects.

- [ ] **Step 1: Write the failing check**

Create `web/scripts/check-auth-routes.sh`:

```bash
#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0

echo "--- /auth/callback with no code redirects to login with an error ---"
loc=$(curl -s -o /dev/null -D - "$BASE/auth/callback" | grep -i '^location:' | tr -d '\r')
echo "location: ${loc:-<none>}"
case "$loc" in
  *"/login"*) echo "PASS" ;;
  *) echo "FAIL: expected a redirect to a login page"; fail=1 ;;
esac

echo "--- /auth/signout returns a redirect ---"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/signout")
echo "status: $code"
case "$code" in
  30*) echo "PASS" ;;
  *) echo "FAIL: expected a 3xx redirect"; fail=1 ;;
esac

exit $fail
```

`chmod +x web/scripts/check-auth-routes.sh`

- [ ] **Step 2: Run it to verify it fails**

Run: `./scripts/check-auth-routes.sh`
Expected: **FAIL** on both — neither route exists, so both return 404 with no `Location`.

- [ ] **Step 3: Determine whether email confirmation is enabled**

This is an open question from the spec and must be established, not guessed. It decides whether `signUp` redirects straight to chat or to a "check your inbox" state.

```bash
cd /Users/sanjaygunabalan2626gmail.com/Documents/FYP/emobuddy/web
SUPA=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2-)
KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2-)
curl -s -X POST "$SUPA/auth/v1/signup" \
  -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"email":"emobuddy-probe@example.com","password":"Probe-Passw0rd!"}' | head -c 600
```

Read the response:
- Contains `"access_token"` → confirmation is **disabled**; signup can redirect straight to `/{lang}/chat`.
- Contains a user object with `"confirmation_sent_at"` and no session → confirmation is **enabled**; signup must land on a "check your inbox" state.

Record the answer in a comment at the top of `lib/auth/actions.ts`. It changes Step 4's `signUp` return.

- [ ] **Step 4: Write the auth actions**

`web/lib/auth/actions.ts`. Adjust only the marked `signUp` branch per Step 3's finding:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  // Per Step 3: when email confirmation is enabled there is no session yet,
  // so tell the user to check their inbox instead of redirecting to chat.
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
```

Note: `redirect()` throws by design in Next.js. Never wrap these calls in a
`try`/`catch` that swallows it.

- [ ] **Step 5: Write the callback route**

`web/app/auth/callback/route.ts`. This handles email confirmation, password
reset, and — should a provider ever be enabled in the Supabase dashboard —
OAuth, with no further changes:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/en/chat";

  if (!code) {
    return NextResponse.redirect(`${origin}/en/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/en/login?error=exchange_failed`);
  }

  // Only allow same-site relative paths, so a crafted link cannot bounce a
  // freshly authenticated user off to another origin.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/en/chat";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
```

- [ ] **Step 6: Write the signout route**

`web/app/auth/signout/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const lang = new URL(request.url).searchParams.get("lang") ?? "en";
  const safeLang = lang === "ms" ? "ms" : "en";
  return NextResponse.redirect(new URL(`/${safeLang}`, request.url), {
    status: 303,
  });
}
```

- [ ] **Step 7: Run the check to verify it passes**

Run: `./scripts/check-auth-routes.sh`
Expected: **PASS** on both.

- [ ] **Step 8: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add web/lib/auth web/app/auth web/scripts
git commit -m "Add Supabase auth actions, callback, and signout routes"
```

---

### Task 3: Auth dictionary keys and unstyled auth pages

**Files:**
- Modify: `web/lib/dictionaries/types.ts` (add an `auth` section to the `Dictionary` type)
- Modify: `web/lib/dictionaries/en.ts` (add the `auth` object)
- Modify: `web/lib/dictionaries/ms.ts` (add the `auth` object)
- Create: `web/app/[lang]/(auth)/layout.tsx`
- Create: `web/app/[lang]/(auth)/login/page.tsx`
- Create: `web/app/[lang]/(auth)/signup/page.tsx`
- Create: `web/app/[lang]/(auth)/forgot-password/page.tsx`
- Create: `web/app/[lang]/(auth)/reset-password/page.tsx`
- Create: `web/components/auth/AuthForm.tsx`

**Interfaces:**
- Consumes: the actions and `AuthState` from `@/lib/auth/actions` (Task 2); `getDictionary`, `hasLocale`, `Locale` from `@/lib/dictionaries`.
- Produces: `Dictionary["auth"]`, consumed by nothing else; the four routes `SiteNav` already links to.

**Reminder:** these pages are intentionally plain. Do not design them.

- [ ] **Step 1: Write the failing check**

Create `web/scripts/check-auth-pages.sh`:

```bash
#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
for path in /en/login /en/signup /en/forgot-password /ms/login /ms/signup; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  printf "%-22s %s " "$path" "$code"
  if [ "$code" = "200" ]; then echo "PASS"; else echo "FAIL"; fail=1; fi
done
echo "--- BM page must not show the English label ---"
if curl -s "$BASE/ms/login" | grep -qi "Log Masuk"; then
  echo "PASS: Malay copy present"
else
  echo "FAIL: Malay copy missing"; fail=1
fi
exit $fail
```

`chmod +x web/scripts/check-auth-pages.sh`

- [ ] **Step 2: Run it to verify it fails**

Run: `./scripts/check-auth-pages.sh`
Expected: **FAIL** — every path returns 404. `SiteNav` links to `/en/login` and `/en/signup` today and both are dead.

- [ ] **Step 3: Add the auth section to the Dictionary type**

In `web/lib/dictionaries/types.ts`, inside the `Dictionary` type, after the `nav` block:

```ts
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    signUpTitle: string;
    signUpSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    newPasswordLabel: string;
    submitSignIn: string;
    submitSignUp: string;
    submitReset: string;
    submitNewPassword: string;
    forgotPassword: string;
    forgotTitle: string;
    forgotSubtitle: string;
    resetTitle: string;
    resetSubtitle: string;
    noAccount: string;
    hasAccount: string;
    checkInbox: string;
    confirmEmail: string;
    working: string;
    errors: {
      missingFields: string;
      passwordTooShort: string;
      generic: string;
    };
  };
```

- [ ] **Step 4: Add the English copy**

In `web/lib/dictionaries/en.ts`, after the `nav` object:

```ts
  auth: {
    signInTitle: "Welcome back",
    signInSubtitle: "Sign in to continue your check-ins.",
    signUpTitle: "Create your account",
    signUpSubtitle: "Start checking in with EmoBuddy — it's free.",
    emailLabel: "Email",
    passwordLabel: "Password",
    newPasswordLabel: "New password",
    submitSignIn: "Sign In",
    submitSignUp: "Create Account",
    submitReset: "Send Reset Link",
    submitNewPassword: "Update Password",
    forgotPassword: "Forgot your password?",
    forgotTitle: "Reset your password",
    forgotSubtitle: "We'll email you a link to set a new one.",
    resetTitle: "Set a new password",
    resetSubtitle: "Choose a password you haven't used before.",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    checkInbox: "Check your inbox for the link.",
    confirmEmail: "Almost there — confirm your email to finish signing up.",
    working: "Please wait…",
    errors: {
      missingFields: "Please fill in every field.",
      passwordTooShort: "Password must be at least 6 characters.",
      generic: "Something went wrong. Please try again.",
    },
  },
```

- [ ] **Step 5: Add the Malay copy**

In `web/lib/dictionaries/ms.ts`, after the `nav` object:

```ts
  auth: {
    signInTitle: "Selamat kembali",
    signInSubtitle: "Log masuk untuk meneruskan semakan anda.",
    signUpTitle: "Cipta akaun anda",
    signUpSubtitle: "Mulakan semakan bersama EmoBuddy — percuma.",
    emailLabel: "E-mel",
    passwordLabel: "Kata laluan",
    newPasswordLabel: "Kata laluan baharu",
    submitSignIn: "Log Masuk",
    submitSignUp: "Cipta Akaun",
    submitReset: "Hantar Pautan Tetapan Semula",
    submitNewPassword: "Kemas Kini Kata Laluan",
    forgotPassword: "Lupa kata laluan anda?",
    forgotTitle: "Tetapkan semula kata laluan",
    forgotSubtitle: "Kami akan e-mel pautan untuk menetapkan yang baharu.",
    resetTitle: "Tetapkan kata laluan baharu",
    resetSubtitle: "Pilih kata laluan yang belum pernah anda guna.",
    noAccount: "Belum ada akaun?",
    hasAccount: "Sudah ada akaun?",
    checkInbox: "Semak peti masuk anda untuk pautan tersebut.",
    confirmEmail: "Hampir siap — sahkan e-mel anda untuk melengkapkan pendaftaran.",
    working: "Sila tunggu…",
    errors: {
      missingFields: "Sila isi semua ruangan.",
      passwordTooShort: "Kata laluan mesti sekurang-kurangnya 6 aksara.",
      generic: "Ada sesuatu yang tidak kena. Sila cuba lagi.",
    },
  },
```

Flag this BM copy for the same native-speaker review already pending on the rest of the site. Do not treat it as final.

- [ ] **Step 6: Write the shared form component**

`web/components/auth/AuthForm.tsx` — one client component all four pages reuse:

```tsx
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
```

- [ ] **Step 7: Write the auth layout**

`web/app/[lang]/(auth)/layout.tsx` — deliberately minimal, no nav or footer:

```tsx
import { hasLocale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <main>{children}</main>;
}
```

- [ ] **Step 8: Write the login page**

`web/app/[lang]/(auth)/login/page.tsx`:

```tsx
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
```

- [ ] **Step 9: Write the signup page**

`web/app/[lang]/(auth)/signup/page.tsx` — same shape, `signUp` action:

```tsx
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
```

- [ ] **Step 10: Write the forgot-password page**

`web/app/[lang]/(auth)/forgot-password/page.tsx`:

```tsx
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
```

- [ ] **Step 11: Write the reset-password page**

`web/app/[lang]/(auth)/reset-password/page.tsx`:

```tsx
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
```

- [ ] **Step 12: Run the check to verify it passes**

Run: `./scripts/check-auth-pages.sh`
Expected: **PASS** on all six paths and the Malay-copy assertion.

- [ ] **Step 13: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors. If `en.ts` or `ms.ts` is missing an `auth` key, this is where it surfaces — that is the point of the type.

- [ ] **Step 14: Commit**

```bash
git add web/lib/dictionaries web/app/[lang]/\(auth\) web/components/auth web/scripts
git commit -m "Add bilingual auth pages (unstyled) for login, signup, and reset"
```

---

### Task 4: Chat types, ML wrapper, and the persistence layer

**Files:**
- Create: `web/lib/chat/types.ts`
- Create: `web/lib/chat/ml.ts`
- Create: `web/lib/chat/sessions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 1).
- Produces:
  - `type Emotion = "happy" | "sad" | "angry" | "neutral"`, `type Language = "en" | "ms"`, `ModalityResult`, `SelfCareItem`, `HotlineEntry`, `AnalyzeResponse`, `ChatReplyResponse`
  - `chatReply(messages: string[], language: Language): Promise<ChatReplyResponse>`
  - `analyzeConversation(messages: string[], language: Language): Promise<AnalyzeResponse>`
  - `class MlServiceError extends Error { status: number }`
  - `createSession(userId, title): Promise<string>`
  - `addMessage(userId, {sessionId, role, type, content, metadata}): Promise<void>`
  - `getUserMessages(userId, sessionId): Promise<string[]>`
  - `saveAnalysis(userId, {sessionId, result, source, language, conversationText}): Promise<void>`
  - `listSessions(userId): Promise<SessionRow[]>`
  - `getSessionMessages(userId, sessionId): Promise<ChatMessageRow[]>`
  - `deleteSession(userId, sessionId): Promise<void>`

- [ ] **Step 1: Write the failing check**

Create `web/scripts/check-ml-wrapper.mjs`:

```js
// Verifies the ml-service wrapper against the live Render deployment.
// Run: node --env-file=.env.local scripts/check-ml-wrapper.mjs
import { chatReply, analyzeConversation } from "../lib/chat/ml.ts";

let failed = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
};

const reply = await chatReply(["I've been feeling really down lately"], "en");
check("chatReply returns a non-empty reply", typeof reply.reply === "string" && reply.reply.length > 0, reply.reply?.slice(0, 60));
check("chatReply reports crisis=false for ordinary text", reply.crisis === false);

const crisis = await chatReply(["I want to kill myself"], "en");
check("chatReply flags a crisis phrase", crisis.crisis === true);

const analysis = await analyzeConversation(["I'm so stressed about my exams"], "en");
check("analyze returns a 4-class label", ["happy", "sad", "angry", "neutral"].includes(analysis.fusion_result.label), analysis.fusion_result.label);
check("analyze returns a 3-day plan", analysis.self_care_plan.length === 3);

const ms = await analyzeConversation(["Saya rasa sangat sedih hari ini"], "ms");
check("analyze honours the ms language", ms.response_message.length > 0, ms.response_message.slice(0, 60));

process.exit(failed === 0 ? 0 : 1);
```

Note: run this with `npx tsx` since it imports a `.ts` module —
`npx tsx --env-file=.env.local scripts/check-ml-wrapper.mjs`. If `tsx` is not
available, run it via `npx tsx@4` (no dependency added to `package.json`).

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx --env-file=.env.local scripts/check-ml-wrapper.mjs`
Expected: **FAIL** — `Cannot find module '../lib/chat/ml.ts'`.

- [ ] **Step 3: Write the types**

`web/lib/chat/types.ts` — a direct mirror of `ml-service/app/schemas.py`. Keep the snake_case field names; they are what the API actually returns, and renaming invites drift:

```ts
export type Emotion = "happy" | "sad" | "angry" | "neutral";
export type Language = "en" | "ms";
export type MessageRole = "user" | "ai";
export type MessageType = "text" | "voice" | "mood" | "plan" | "crisis";
export type Source = "text" | "voice" | "both";

export type ModalityResult = {
  label: Emotion;
  confidence: number;
  probs?: Record<Emotion, number> | null;
};

export type SelfCareItem = { day: number; activity: string };

export type HotlineEntry = { name: string; phone: string; description: string };

export type AnalyzeResponse = {
  text_result: ModalityResult | null;
  audio_result: ModalityResult | null;
  fusion_result: ModalityResult;
  crisis: boolean;
  response_message: string;
  self_care_plan: SelfCareItem[];
  hotlines: HotlineEntry[];
};

export type ChatReplyResponse = { reply: string; crisis: boolean };

export type SessionRow = {
  id: string;
  title: string | null;
  created_at: string;
  source: Source;
  fusion_result: Emotion;
  crisis_triggered: boolean;
};

export type ChatMessageRow = {
  id: string;
  session_id: string;
  role: MessageRole;
  type: MessageType;
  content: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
```

- [ ] **Step 4: Write the ML wrapper**

`web/lib/chat/ml.ts`:

```ts
import "server-only";
import type { AnalyzeResponse, ChatReplyResponse, Language } from "./types";

// Render's free tier cold-starts at roughly 50s. The platform default would
// abort well before that and look like an outage during judging.
const TIMEOUT_MS = 90_000;

export class MlServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MlServiceError";
    this.status = status;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const base = process.env.ML_SERVICE_URL;
  if (!base) throw new MlServiceError("ML_SERVICE_URL is not set", 500);

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (cause) {
    throw new MlServiceError(`ml-service unreachable: ${String(cause)}`, 502);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new MlServiceError(
      `ml-service ${path} returned ${response.status}: ${detail.slice(0, 200)}`,
      502,
    );
  }

  return (await response.json()) as T;
}

export function chatReply(messages: string[], language: Language) {
  return post<ChatReplyResponse>("/chat/reply", { messages, language });
}

export function analyzeConversation(messages: string[], language: Language) {
  return post<AnalyzeResponse>("/analyze/conversation", { messages, language });
}
```

- [ ] **Step 5: Run the ML check to verify it passes**

Run: `npx tsx --env-file=.env.local scripts/check-ml-wrapper.mjs`
Expected: **PASS** on all six checks. The first call may take up to ~50s if Render has spun down — record the actual observed latency in the commit message, since the spec lists it as an open question.

- [ ] **Step 6: Write the persistence layer**

`web/lib/chat/sessions.ts`. This is the server-side counterpart to
`app/lib/services/session_service.dart`; the two write the same tables and must
stay schema-compatible. Note the `metadata: {result}` shape — the Flutter
history screen reads exactly that key:

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AnalyzeResponse,
  ChatMessageRow,
  Language,
  MessageRole,
  MessageType,
  SessionRow,
  Source,
} from "./types";

/**
 * Server-side mirror of app/lib/services/session_service.dart.
 * Both clients write the same rows, so a session started on the web opens in
 * the Flutter app and vice versa. Changes here need a matching change there.
 */

export async function createSession(userId: string, title: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_logs")
    .insert({
      user_id: userId,
      title: title.slice(0, 80),
      source: "text",
      fusion_result: "neutral",
      confidence: 0.0,
      crisis_triggered: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(`createSession failed: ${error.message}`);
  return data.id as string;
}

export async function addMessage(
  userId: string,
  args: {
    sessionId: string;
    role: MessageRole;
    type: MessageType;
    content?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    session_id: args.sessionId,
    user_id: userId,
    role: args.role,
    type: args.type,
    content: args.content ?? null,
    metadata: args.metadata ?? {},
  });
  if (error) throw new Error(`addMessage failed: ${error.message}`);
}

/** The user's own messages for a session, oldest first — what ml-service wants. */
export async function getUserMessages(userId: string, sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("content")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getUserMessages failed: ${error.message}`);
  return (data ?? [])
    .map((row) => row.content as string | null)
    .filter((c): c is string => Boolean(c));
}

export async function saveAnalysis(
  userId: string,
  args: {
    sessionId: string;
    result: AnalyzeResponse;
    source: Source;
    language: Language;
    conversationText?: string;
  },
) {
  const supabase = await createClient();
  const { result, sessionId } = args;

  const { error: updateError } = await supabase
    .from("mood_logs")
    .update({
      source: args.source,
      text_result: result.text_result?.label ?? null,
      audio_result: result.audio_result?.label ?? null,
      fusion_result: result.fusion_result.label,
      confidence: result.fusion_result.confidence,
      crisis_triggered: result.crisis,
      conversation_text: args.conversationText ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) throw new Error(`saveAnalysis update failed: ${updateError.message}`);

  await addMessage(userId, {
    sessionId,
    role: "ai",
    type: result.crisis ? "crisis" : "mood",
    content: result.response_message,
    metadata: { result },
  });

  if (!result.crisis && result.self_care_plan.length > 0) {
    await addMessage(userId, {
      sessionId,
      role: "ai",
      type: "plan",
      content: null,
      metadata: { result },
    });

    const { error: planError } = await supabase.from("self_care_plans").insert(
      result.self_care_plan.map((item) => ({
        user_id: userId,
        mood_log_id: sessionId,
        day_index: item.day,
        activity: item.activity,
        language: args.language,
      })),
    );
    if (planError) throw new Error(`saveAnalysis plans failed: ${planError.message}`);
  }
}

export async function listSessions(userId: string): Promise<SessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_logs")
    .select("id, title, created_at, source, fusion_result, crisis_triggered")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listSessions failed: ${error.message}`);
  return (data ?? []) as SessionRow[];
}

export async function getSessionMessages(
  userId: string,
  sessionId: string,
): Promise<ChatMessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, session_id, role, type, content, metadata, created_at")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getSessionMessages failed: ${error.message}`);
  return (data ?? []) as ChatMessageRow[];
}

export async function deleteSession(userId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mood_logs")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) throw new Error(`deleteSession failed: ${error.message}`);
}
```

- [ ] **Step 7: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add web/lib/chat web/scripts
git commit -m "Add chat types, ml-service wrapper, and server-side persistence

Mirrors ml-service/app/schemas.py and app/lib/services/session_service.dart
so the web and Flutter clients write schema-compatible rows.

Observed ml-service cold-start latency: <fill in from Step 5>"
```

---

### Task 5: POST /api/chat/reply

**Files:**
- Create: `web/lib/api/auth.ts`
- Create: `web/app/api/chat/reply/route.ts`

**Interfaces:**
- Consumes: `chatReply`, `MlServiceError` from `@/lib/chat/ml`; `createSession`, `addMessage`, `getUserMessages` from `@/lib/chat/sessions`; `createClient` from `@/lib/supabase/server`.
- Produces:
  - `requireUser(): Promise<{ id: string } | null>` from `@/lib/api/auth`
  - `POST /api/chat/reply`, body `{ sessionId?: string; message: string; language?: "en"|"ms" }`, returns `{ sessionId: string; reply: string; crisis: boolean; persisted: boolean }`

- [ ] **Step 1: Write the failing check**

Create `web/scripts/check-chat-api-auth.sh`:

```bash
#!/usr/bin/env bash
# Unauthenticated calls must be rejected with 401 — never a redirect, since
# these are fetch targets, not navigations.
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
for path in /api/chat/reply /api/chat/analyze; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE$path" \
    -H "Content-Type: application/json" -d '{"message":"hi"}')
  printf "%-22s %s " "$path" "$code"
  if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
done
exit $fail
```

`chmod +x web/scripts/check-chat-api-auth.sh`

- [ ] **Step 2: Run it to verify it fails**

Run: `./scripts/check-chat-api-auth.sh`
Expected: **FAIL** — both return 404. (`/api/chat/analyze` stays failing until Task 6; that is expected.)

- [ ] **Step 3: Write the auth helper**

`web/lib/api/auth.ts`:

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the signed-in user for an API route, or null.
 * Uses getUser() rather than getSession(): getSession() trusts the cookie
 * without revalidating it against Supabase.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}
```

- [ ] **Step 4: Write the reply route**

`web/app/api/chat/reply/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { chatReply, MlServiceError } from "@/lib/chat/ml";
import { addMessage, createSession, getUserMessages } from "@/lib/chat/sessions";
import type { Language } from "@/lib/chat/types";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; message?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }
  const language: Language = body.language === "ms" ? "ms" : "en";

  // Session first: the user's message must be durable before we spend 50s
  // waiting on a cold-starting ml-service.
  const sessionId =
    body.sessionId ?? (await createSession(user.id, message));
  await addMessage(user.id, {
    sessionId,
    role: "user",
    type: "text",
    content: message,
  });

  const history = await getUserMessages(user.id, sessionId);

  let result;
  try {
    result = await chatReply(history.length > 0 ? history : [message], language);
  } catch (error) {
    const status = error instanceof MlServiceError ? error.status : 502;
    return NextResponse.json(
      { error: "ml_service_failed", sessionId },
      { status },
    );
  }

  // The reply is already generated. If persisting it fails, still return it —
  // a lost row must not look to the user like the chatbot broke.
  let persisted = true;
  try {
    await addMessage(user.id, {
      sessionId,
      role: "ai",
      type: result.crisis ? "crisis" : "text",
      content: result.reply,
    });
  } catch {
    persisted = false;
  }

  return NextResponse.json({
    sessionId,
    reply: result.reply,
    crisis: result.crisis,
    persisted,
  });
}
```

- [ ] **Step 5: Run the auth check**

Run: `./scripts/check-chat-api-auth.sh`
Expected: `/api/chat/reply` **PASS** (401). `/api/chat/analyze` still FAIL (404) — it arrives in Task 6.

- [ ] **Step 6: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add web/lib/api web/app/api/chat/reply web/scripts
git commit -m "Add POST /api/chat/reply with server-side persistence"
```

---

### Task 6: POST /api/chat/analyze

**Files:**
- Create: `web/app/api/chat/analyze/route.ts`

**Interfaces:**
- Consumes: `requireUser` from `@/lib/api/auth`; `analyzeConversation`, `MlServiceError` from `@/lib/chat/ml`; `getUserMessages`, `saveAnalysis` from `@/lib/chat/sessions`.
- Produces: `POST /api/chat/analyze`, body `{ sessionId: string; language?: "en"|"ms" }`, returns `AnalyzeResponse & { persisted: boolean }`.

- [ ] **Step 1: Write the failing check**

Reuse `scripts/check-chat-api-auth.sh` from Task 5 — it already asserts
`/api/chat/analyze` returns 401.

- [ ] **Step 2: Run it to verify it fails**

Run: `./scripts/check-chat-api-auth.sh`
Expected: `/api/chat/analyze` **FAIL** with 404.

- [ ] **Step 3: Write the analyze route**

`web/app/api/chat/analyze/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { analyzeConversation, MlServiceError } from "@/lib/chat/ml";
import { getUserMessages, saveAnalysis } from "@/lib/chat/sessions";
import type { Language } from "@/lib/chat/types";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sessionId = body.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "session_required" }, { status: 400 });
  }
  const language: Language = body.language === "ms" ? "ms" : "en";

  // RLS scopes this to the caller, so an unowned session reads as empty
  // rather than leaking another user's conversation.
  const messages = await getUserMessages(user.id, sessionId);
  if (messages.length === 0) {
    return NextResponse.json({ error: "session_empty" }, { status: 404 });
  }

  let result;
  try {
    result = await analyzeConversation(messages, language);
  } catch (error) {
    const status = error instanceof MlServiceError ? error.status : 502;
    return NextResponse.json({ error: "ml_service_failed" }, { status });
  }

  let persisted = true;
  try {
    await saveAnalysis(user.id, {
      sessionId,
      result,
      source: "text",
      language,
      conversationText: messages.join("\n"),
    });
  } catch {
    persisted = false;
  }

  return NextResponse.json({ ...result, persisted });
}
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `./scripts/check-chat-api-auth.sh`
Expected: **PASS** on both routes.

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/app/api/chat/analyze
git commit -m "Add POST /api/chat/analyze that persists the mood result and plan"
```

---

### Task 7: GET and DELETE /api/chat/sessions

**Files:**
- Create: `web/app/api/chat/sessions/route.ts`

**Interfaces:**
- Consumes: `requireUser`; `listSessions`, `getSessionMessages`, `deleteSession` from `@/lib/chat/sessions`.
- Produces:
  - `GET /api/chat/sessions` → `{ sessions: SessionRow[] }`
  - `GET /api/chat/sessions?id=<uuid>` → `{ messages: ChatMessageRow[] }`
  - `DELETE /api/chat/sessions?id=<uuid>` → `{ ok: true }`

- [ ] **Step 1: Write the failing check**

Create `web/scripts/check-sessions-api.sh`:

```bash
#!/usr/bin/env bash
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/chat/sessions")
printf "GET  /api/chat/sessions %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/chat/sessions?id=x")
printf "DEL  /api/chat/sessions %s " "$code"
if [ "$code" = "401" ]; then echo "PASS"; else echo "FAIL (want 401)"; fail=1; fi
exit $fail
```

`chmod +x web/scripts/check-sessions-api.sh`

- [ ] **Step 2: Run it to verify it fails**

Run: `./scripts/check-sessions-api.sh`
Expected: **FAIL** — both 404.

- [ ] **Step 3: Write the sessions route**

`web/app/api/chat/sessions/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  deleteSession,
  getSessionMessages,
  listSessions,
} from "@/lib/chat/sessions";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    return NextResponse.json({ messages: await getSessionMessages(user.id, id) });
  }
  return NextResponse.json({ sessions: await listSessions(user.id) });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  await deleteSession(user.id, id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `./scripts/check-sessions-api.sh`
Expected: **PASS** on both.

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/app/api/chat/sessions web/scripts
git commit -m "Add GET/DELETE /api/chat/sessions"
```

---

### Task 8: Chat dictionary keys, the guarded chat page, and its client

**Files:**
- Modify: `web/lib/dictionaries/types.ts` (add a `chat` section)
- Modify: `web/lib/dictionaries/en.ts`
- Modify: `web/lib/dictionaries/ms.ts`
- Create: `web/app/[lang]/(app)/layout.tsx`
- Create: `web/app/[lang]/(app)/chat/page.tsx`
- Create: `web/components/chat/ChatClient.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`; the three API routes from Tasks 5–7; `Dictionary`, `Locale`.
- Produces: `Dictionary["chat"]`; the route `/{lang}/chat`, guarded server-side.

**Reminder:** unstyled. A plain list and a form. Do not design it.

- [ ] **Step 1: Write the failing check**

Create `web/scripts/check-chat-guard.sh`:

```bash
#!/usr/bin/env bash
# A signed-out visitor must be redirected to login, not shown the chat.
set -u
BASE="${BASE:-http://localhost:3003}"
fail=0
for lang in en ms; do
  loc=$(curl -s -o /dev/null -D - "$BASE/$lang/chat" | grep -i '^location:' | tr -d '\r')
  printf "/%s/chat -> %s " "$lang" "${loc:-<none>}"
  case "$loc" in
    *"/$lang/login"*) echo "PASS" ;;
    *) echo "FAIL: expected redirect to /$lang/login"; fail=1 ;;
  esac
done
exit $fail
```

`chmod +x web/scripts/check-chat-guard.sh`

- [ ] **Step 2: Run it to verify it fails**

Run: `./scripts/check-chat-guard.sh`
Expected: **FAIL** — `/en/chat` is a 404 with no `Location`.

- [ ] **Step 3: Add the chat section to the Dictionary type**

In `web/lib/dictionaries/types.ts`, inside `Dictionary`:

```ts
  chat: {
    title: string;
    greeting: string;
    inputPlaceholder: string;
    send: string;
    getPlan: string;
    thinking: string;
    planTitle: string;
    dayLabel: string;
    signOut: string;
    newChat: string;
    notSaved: string;
    errorReply: string;
    errorPlan: string;
    crisisNotice: string;
  };
```

- [ ] **Step 4: Add the English copy**

In `web/lib/dictionaries/en.ts`:

```ts
  chat: {
    title: "Check in with EmoBuddy",
    greeting: "Hi! I'm EmoBuddy. How are you feeling right now?",
    inputPlaceholder: "Tell me how you're feeling…",
    send: "Send",
    getPlan: "Get my plan",
    thinking: "EmoBuddy is thinking…",
    planTitle: "Your 3-day self-care plan",
    dayLabel: "Day",
    signOut: "Sign Out",
    newChat: "New chat",
    notSaved: "Saved to this page only — we couldn't store this message.",
    errorReply: "I couldn't reach EmoBuddy just now. Please try again.",
    errorPlan: "I couldn't put your plan together just now. Please try again.",
    crisisNotice:
      "It sounds like you're going through something serious. Please reach out to one of these services.",
  },
```

- [ ] **Step 5: Add the Malay copy**

In `web/lib/dictionaries/ms.ts`:

```ts
  chat: {
    title: "Luahkan perasaan bersama EmoBuddy",
    greeting: "Hai! Saya EmoBuddy. Bagaimana perasaan anda sekarang?",
    inputPlaceholder: "Ceritakan perasaan anda…",
    send: "Hantar",
    getPlan: "Dapatkan pelan saya",
    thinking: "EmoBuddy sedang berfikir…",
    planTitle: "Pelan penjagaan diri 3 hari anda",
    dayLabel: "Hari",
    signOut: "Log Keluar",
    newChat: "Perbualan baharu",
    notSaved: "Disimpan pada halaman ini sahaja — mesej ini gagal disimpan.",
    errorReply: "Saya tidak dapat menghubungi EmoBuddy sekarang. Sila cuba lagi.",
    errorPlan: "Saya tidak dapat menyediakan pelan anda sekarang. Sila cuba lagi.",
    crisisNotice:
      "Nampaknya anda sedang melalui sesuatu yang serius. Sila hubungi salah satu perkhidmatan ini.",
  },
```

Flag for the same native-speaker review as Task 3.

- [ ] **Step 6: Write the guarded layout**

`web/app/[lang]/(app)/layout.tsx`. The guard lives here rather than only in
`proxy.ts`, so a proxy misconfiguration cannot silently expose the route:

```tsx
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "@/lib/dictionaries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login`);

  return <main>{children}</main>;
}
```

- [ ] **Step 7: Write the chat page**

`web/app/[lang]/(app)/chat/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <ChatClient lang={lang} dict={dict.chat} />;
}
```

- [ ] **Step 8: Write the chat client**

`web/components/chat/ChatClient.tsx`. It talks only to the API routes — no
Supabase, no `ml-service`:

```tsx
"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { AnalyzeResponse } from "@/lib/chat/types";

type Bubble =
  | { kind: "text"; from: "user" | "ai"; text: string }
  | { kind: "plan"; result: AnalyzeResponse };

export function ChatClient({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["chat"];
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { kind: "text", from: "ai", text: dict.greeting },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    setInput("");
    setBusy(true);
    setNotice(null);
    setBubbles((b) => [...b, { kind: "text", from: "user", text: message }]);

    try {
      const response = await fetch("/api/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message, language: lang }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const data = await response.json();
      setSessionId(data.sessionId);
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: data.reply }]);
      if (data.persisted === false) setNotice(dict.notSaved);
    } catch {
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: dict.errorReply }]);
    } finally {
      setBusy(false);
    }
  }

  async function getPlan() {
    if (!sessionId || busy) return;
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, language: lang }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const result: AnalyzeResponse & { persisted: boolean } = await response.json();
      setBubbles((b) => [
        ...b,
        { kind: "text", from: "ai", text: result.response_message },
        { kind: "plan", result },
      ]);
      if (result.persisted === false) setNotice(dict.notSaved);
    } catch {
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: dict.errorPlan }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>{dict.title}</h1>

      <ul>
        {bubbles.map((bubble, i) =>
          bubble.kind === "text" ? (
            <li key={i} data-from={bubble.from}>
              <strong>{bubble.from === "user" ? "You" : "EmoBuddy"}:</strong>{" "}
              {bubble.text}
            </li>
          ) : (
            <li key={i}>
              {bubble.result.crisis ? (
                <div>
                  <p>{dict.crisisNotice}</p>
                  <ul>
                    {bubble.result.hotlines.map((h) => (
                      <li key={h.phone}>
                        {h.name} — {h.phone} — {h.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <p>{dict.planTitle}</p>
                  <ol>
                    {bubble.result.self_care_plan.map((item) => (
                      <li key={item.day}>
                        {dict.dayLabel} {item.day}: {item.activity}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          ),
        )}
        {busy && <li>{dict.thinking}</li>}
      </ul>

      {notice && <p role="status">{notice}</p>}

      <form onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={dict.inputPlaceholder}
          aria-label={dict.inputPlaceholder}
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {dict.send}
        </button>
      </form>

      <button type="button" onClick={getPlan} disabled={!sessionId || busy}>
        {dict.getPlan}
      </button>

      <form action={`/auth/signout?lang=${lang}`} method="post">
        <button type="submit">{dict.signOut}</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 9: Run the guard check to verify it passes**

Run: `./scripts/check-chat-guard.sh`
Expected: **PASS** — both `/en/chat` and `/ms/chat` redirect to their login page.

- [ ] **Step 10: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add web/lib/dictionaries web/app/[lang]/\(app\) web/components/chat web/scripts
git commit -m "Add the guarded bilingual chat page (unstyled) and its client"
```

---

### Task 9: End-to-end smoke test and Playwright verification

The individual checks so far prove each route in isolation. This task proves the whole thing works for a real signed-in user and that RLS actually isolates them.

**Files:**
- Create: `web/scripts/smoke-auth-chat.mjs`
- Create: `web/scripts/README.md`

**Interfaces:**
- Consumes: every route from Tasks 2, 5, 6, 7.
- Produces: nothing other tasks depend on.

**Note on cleanup:** the script deletes its rows, but **cannot delete the auth
users** — that needs a service-role key, which this design deliberately does not
introduce. Use clearly-labelled `emobuddy-smoke-<timestamp>@example.com`
addresses and note in the output that they linger in `auth.users` for manual
removal from the dashboard. Do not add a service-role key to make cleanup
tidier.

- [ ] **Step 1: Write the smoke test**

`web/scripts/smoke-auth-chat.mjs`:

```js
// End-to-end smoke test against a running dev server and the live Supabase +
// ml-service deployments.
//
// Run: node --env-file=.env.local scripts/smoke-auth-chat.mjs
//
// Creates two throwaway users, drives the full chat flow as user A, asserts
// the rows landed, and asserts user B cannot read user A's session.
// It deletes its own rows but cannot delete the auth users — see README.md.

import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "http://localhost:3003";
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}

const stamp = Date.now();
const users = {
  a: { email: `emobuddy-smoke-${stamp}-a@example.com`, password: "Smoke-Passw0rd!" },
  b: { email: `emobuddy-smoke-${stamp}-b@example.com`, password: "Smoke-Passw0rd!" },
};

/** Signs a user up and returns a supabase-js client holding their session. */
async function makeUser(creds) {
  const client = createClient(SUPA, ANON);
  const { error: signUpError } = await client.auth.signUp(creds);
  if (signUpError) throw new Error(`signUp failed: ${signUpError.message}`);

  const { data, error } = await client.auth.signInWithPassword(creds);
  if (error) throw new Error(`signIn failed: ${error.message}`);
  return {
    client,
    userId: data.user.id,
    session: data.session,
  };
}

/**
 * Calls an API route as a given user. The routes read the session from
 * cookies, so we present the Supabase auth cookie the same way a browser does:
 * @supabase/ssr 0.12.6 stores the whole session object, base64url-encoded,
 * behind a `base64-` prefix.
 */
function authCookie(session) {
  const ref = new URL(SUPA).hostname.split(".")[0];
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `sb-${ref}-auth-token=base64-${encoded}`;
}

async function api(path, { method = "POST", body, user }) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie(user.session),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

console.log(`Base: ${BASE}`);
console.log(`Supabase: ${SUPA}\n`);

// --- 1. Auth -------------------------------------------------------------
const a = await makeUser(users.a);
check("user A signs up and signs in", Boolean(a.session?.access_token));

const unauth = await fetch(`${BASE}/api/chat/reply`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "hello" }),
});
check("unauthenticated /api/chat/reply is 401", unauth.status === 401, String(unauth.status));

// --- 2. Chat -------------------------------------------------------------
const first = await api("/api/chat/reply", {
  body: { message: "I've been really stressed about my final year project", language: "en" },
  user: a,
});
const firstBody = await first.json();
check("first message returns 200", first.status === 200, String(first.status));
check("a sessionId comes back", Boolean(firstBody.sessionId));
check("a reply comes back", typeof firstBody.reply === "string" && firstBody.reply.length > 0, firstBody.reply?.slice(0, 60));
check("the message was persisted", firstBody.persisted === true);

const sessionId = firstBody.sessionId;

const second = await api("/api/chat/reply", {
  body: { sessionId, message: "I haven't been sleeping well either", language: "en" },
  user: a,
});
const secondBody = await second.json();
check("second message reuses the session", secondBody.sessionId === sessionId);

// --- 3. Analysis ---------------------------------------------------------
const analyzed = await api("/api/chat/analyze", {
  body: { sessionId, language: "en" },
  user: a,
});
const result = await analyzed.json();
check("analyze returns 200", analyzed.status === 200, String(analyzed.status));
check("a 4-class label comes back", ["happy", "sad", "angry", "neutral"].includes(result.fusion_result?.label), result.fusion_result?.label);
check("a 3-day plan comes back", result.self_care_plan?.length === 3);

// --- 4. Rows actually landed --------------------------------------------
const { data: messages } = await a.client
  .from("chat_messages")
  .select("role, type, content")
  .eq("session_id", sessionId)
  .order("created_at", { ascending: true });

check("both user messages persisted", messages.filter((m) => m.role === "user").length === 2);
check("ai replies persisted", messages.filter((m) => m.role === "ai" && m.type === "text").length === 2);
check("a mood message persisted", messages.some((m) => m.type === "mood"));
check("a plan message persisted", messages.some((m) => m.type === "plan"));

const { data: log } = await a.client
  .from("mood_logs")
  .select("fusion_result, confidence, conversation_text, title")
  .eq("id", sessionId)
  .single();
check("mood_logs was updated with the result", log.fusion_result === result.fusion_result.label);
check("conversation_text was saved", Boolean(log.conversation_text));

const { data: plans } = await a.client
  .from("self_care_plans")
  .select("day_index, activity, language")
  .eq("mood_log_id", sessionId);
check("three self_care_plans rows exist", plans.length === 3, `got ${plans.length}`);

// --- 5. RLS isolation ----------------------------------------------------
const b = await makeUser(users.b);
const { data: leaked } = await b.client
  .from("chat_messages")
  .select("id")
  .eq("session_id", sessionId);
check("user B cannot read user A's messages", (leaked ?? []).length === 0, `saw ${(leaked ?? []).length} rows`);

// --- 6. Cleanup ----------------------------------------------------------
await a.client.from("mood_logs").delete().eq("id", sessionId);
const { data: afterDelete } = await a.client
  .from("chat_messages")
  .select("id")
  .eq("session_id", sessionId);
check("delete cascades to messages", (afterDelete ?? []).length === 0);

console.log(
  `\nThrowaway auth users left behind (delete from the Supabase dashboard):\n  ${users.a.email}\n  ${users.b.email}`,
);
console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it and watch it work — or find the real cookie format**

Run: `node --env-file=.env.local scripts/smoke-auth-chat.mjs`

The `authCookie` helper above encodes the session the way `@supabase/ssr`
0.12.6 expects. If the API calls come back 401, **do not guess**: sign in
through the browser at `/en/login`, read the actual `sb-*-auth-token` cookie
from DevTools → Application → Cookies, and correct `authCookie` to match that
exact shape. A 401 here means the helper is wrong, not that the route is.

Expected once correct: every check PASSES.

- [ ] **Step 3: Write the scripts README**

`web/scripts/README.md`:

```markdown
# Verification scripts

`web/` has no test framework, matching the rest of this repo (see
`ml-service/scripts/`). These are standalone checks, each runnable on its own.

Start the dev server first: `npm run dev -- -p 3003`

| Script | Checks |
|---|---|
| `check-proxy-routing.sh` | `/auth/callback` is not locale-prefixed; locale redirect still works |
| `check-auth-routes.sh` | callback and signout routes respond |
| `check-auth-pages.sh` | all four auth pages render in EN and BM |
| `check-chat-api-auth.sh` | chat APIs return 401 when signed out |
| `check-sessions-api.sh` | sessions API returns 401 when signed out |
| `check-chat-guard.sh` | `/{lang}/chat` redirects a signed-out visitor to login |
| `check-ml-wrapper.mjs` | the live ml-service returns replies, labels, and plans |
| `smoke-auth-chat.mjs` | full signed-in flow, row persistence, and RLS isolation |

`smoke-auth-chat.mjs` creates throwaway users it **cannot delete** — removing an
auth user needs a service-role key, which this codebase deliberately does not
carry. Delete `emobuddy-smoke-*@example.com` from the Supabase dashboard
periodically.
```

- [ ] **Step 4: Drive the real UI with Playwright**

Scripts prove the API. This proves what a person actually does. In a browser at `http://localhost:3003`:

1. Visit `/en/chat` while signed out → lands on `/en/login`.
2. Sign up at `/en/signup` with a fresh throwaway address → lands on `/en/chat`, or shows the confirm-email notice if Task 2 Step 3 found confirmation enabled.
3. Send "I feel overwhelmed with assignments" → an EmoBuddy reply appears.
4. Click "Get my plan" → a mood message and three numbered days appear.
5. Click "Sign Out" → lands on `/en`.
6. Sign in again at `/en/login` → back on `/en/chat`.
7. Repeat step 3 at `/ms/chat` with "Saya rasa sangat tertekan" → the reply and plan come back in Malay.

Record what actually happened at each step. A step that fails is reported as failing.

- [ ] **Step 5: Verify the marketing site is untouched**

Run:
```bash
for p in /en /en/features /en/how-it-works /en/research /en/about /ms /ms/features; do
  printf "%-20s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3003$p)"
done
git status --short web/app/\[lang\]/\(marketing\) web/components/marketing
```
Expected: every path `200`, and **no modified files** under `(marketing)` or `components/marketing`.

- [ ] **Step 6: Verify the production build**

Run: `npm run build`
Expected: build succeeds. Route handlers must appear as dynamic (`ƒ`), not statically prerendered.

- [ ] **Step 7: Commit**

```bash
git add web/scripts
git commit -m "Add end-to-end smoke test and verification script docs"
```

---

## Post-implementation report

Report to the user, honestly:

1. Whether email confirmation is enabled on the Supabase project (Task 2, Step 3) and what that means for their signup UX.
2. Observed `ml-service` cold-start latency (Task 4, Step 5).
3. Actual output of `smoke-auth-chat.mjs` — pasted, not summarised as "all good".
4. What the Playwright pass actually showed.
5. Which files are theirs to restyle, and the promise that restyling them needs no logic changes.
6. That the BM copy in both new dictionary sections still needs the native-speaker review already pending for the rest of the site.
7. That the work is on the `web-auth-chat` branch, unmerged, so they decide when it lands.
