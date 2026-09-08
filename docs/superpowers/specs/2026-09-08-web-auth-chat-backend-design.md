# Web Auth + Chat Backend — Design

Date: 2026-09-08
Status: Approved, pending implementation plan
Scope: `emobuddy/web` (Next.js 16 site) only. No changes to `app/` (Flutter) or `ml-service/`.

## Problem

`emobuddy/web` is a bilingual marketing site with no authentication and no chat.
`SiteNav` already links to `/{lang}/login` and `/{lang}/signup`; both 404. The
Flutter app has a complete chat + auth experience backed by Supabase, and the
FastAPI `ml-service` is deployed and serving every endpoint the web needs. The
gap is entirely the Next.js server layer.

## Division of labour

The user is designing the frontend themselves. This spec covers the server layer
plus **deliberately unstyled** pages that make the server layer verifiable
end-to-end. The user restyles those pages later; restyling must not require
touching any logic.

- **Owned by this spec:** Supabase clients, auth actions, route handlers,
  session guards, chat persistence, dictionary keys, verification scripts.
- **Owned by the user:** all visual design, including the eventual look of the
  auth and chat pages, and everything under `app/[lang]/(marketing)/`.
- **Untouched:** `app/[lang]/(marketing)/**`, `components/marketing/**`.

## What already exists (verified 2026-09-08, not assumed)

| Thing | State |
|---|---|
| `ml-service` on Render | Live. `GET /health` → `{"status":"ok"}` |
| Supabase project `xvyludyzcmziutwhwjhp` | Live. Anon key valid, `role: anon` |
| `mood_logs`, `chat_messages`, `self_care_plans` | All exist, REST returns 200, RLS enabled |
| `@supabase/ssr` 0.12.6, `@supabase/supabase-js` 2.115.0 | Installed, entirely unused |
| `web/` in git | **Untracked** (`?? web/`) |

`ml-service` endpoints the web will consume:

- `POST /chat/reply` → `{reply: string, crisis: boolean}`; body `{messages: string[], language: "en"|"ms"}`
- `POST /analyze/conversation` → `AnalyzeResponse`; body `{messages: string[], language}`

`ML_SERVICE_URL` has no `NEXT_PUBLIC_` prefix, so it is server-only by design.
The browser must never call `ml-service` directly.

## Architecture

### Decision: database writes live on the server

The Flutter app writes to Supabase from the client. The web will **not** mirror
that. All persistence happens inside Next.js route handlers.

Rationale:

1. One round trip per message instead of three (insert → ML → insert).
2. The chat UI reduces to `fetch()` + render, so the user's restyle cannot break
   persistence.
3. Render's free tier cold-starts (~50 s). A server-side fetch controls its own
   timeout; a browser call would be at the mercy of the tab.
4. Auth is enforced in one place rather than trusted from the client.

RLS still applies: route handlers use the request-scoped server client carrying
the user's JWT, not a service-role key. No service-role key is introduced
anywhere in this design.

### Module layout

```
web/
  lib/supabase/server.ts      createClient() over async cookies()
  lib/supabase/client.ts      createBrowserClient()
  lib/supabase/proxy.ts       updateSession(request) — token refresh
  lib/auth/actions.ts         signIn/signUp/signOut/requestReset/updatePassword
  lib/chat/types.ts           TS mirror of ml-service/app/schemas.py
  lib/chat/ml.ts              server-only fetch wrapper around ML_SERVICE_URL
  lib/chat/sessions.ts        server mirror of app/lib/services/session_service.dart
  proxy.ts                    MODIFIED: locale redirect + session refresh
  app/auth/callback/route.ts  PKCE code exchange
  app/api/chat/reply/route.ts
  app/api/chat/analyze/route.ts
  app/api/chat/sessions/route.ts
  app/[lang]/(auth)/login/page.tsx
  app/[lang]/(auth)/signup/page.tsx
  app/[lang]/(auth)/forgot-password/page.tsx
  app/[lang]/(auth)/reset-password/page.tsx
  app/[lang]/(app)/chat/page.tsx
  scripts/smoke-auth-chat.mjs
```

### Supabase client contract (`@supabase/ssr` 0.12.6)

Confirmed against the installed package's types, not from memory:

- `createServerClient(url, key, { cookies: { getAll, setAll } })`. The
  deprecated `get`/`set`/`remove` form must not be used.
- `setAll(cookiesToSet, headers)` takes a **second `headers` argument**. Those
  headers (`Cache-Control: private, no-cache, ...`) must be written onto the
  response, or a CDN can serve one user's session token to another user. This is
  a correctness requirement, not an optimisation.
- A new server client per request. Never share one across requests.

## Two proxy.ts hazards

`proxy.ts` currently does locale redirection only. Merging session refresh into
it introduces two failure modes that must be handled explicitly:

1. **Dropped auth cookies on locale redirect.** The locale branch returns a
   fresh `NextResponse.redirect(...)`. Cookies that Supabase wrote onto the
   refresh response are lost unless copied onto the redirect response. Symptom
   if missed: users appear signed out at random, only on locale-redirected URLs.

2. **`/auth/callback` gets locale-prefixed.** The current matcher
   `/((?!_next|api|.*\..*).*)` matches `/auth/callback` and rewrites it to
   `/en/auth/callback`, which does not exist — every email confirmation and
   password reset link would break. The matcher must exclude `auth`.

Order of operations: refresh the session first, then apply the locale rule,
carrying cookies forward in both branches.

## Data flow

Mirrors `app/lib/pages/chat_screen.dart` so both clients produce
schema-compatible rows.

**Sending a message** — `POST /api/chat/reply` `{sessionId?, message, language}`

1. Resolve user from the session cookie. No user → 401.
2. `sessionId` absent → insert a `mood_logs` row (the session), title derived
   from the first message.
3. Insert `chat_messages` `{role:'user', type:'text', content: message}`.
4. Load prior user messages for the session; `POST` them to `/chat/reply`.
5. Insert `chat_messages` `{role:'ai', type: crisis ? 'crisis' : 'text', content: reply}`.
6. Return `{sessionId, reply, crisis}`.

**Requesting a plan** — `POST /api/chat/analyze` `{sessionId, language}`

1. Auth check, session ownership check.
2. `POST /analyze/conversation` with the session's user messages.
3. `saveAnalysis`: update the `mood_logs` row (`source`, `text_result`,
   `audio_result`, `fusion_result`, `confidence`, `crisis_triggered`,
   `conversation_text`), insert an ai `mood`/`crisis` message, and — when not a
   crisis — insert a `plan` message plus one `self_care_plans` row per day.
4. Return the full `AnalyzeResponse`.

**Sessions** — `GET /api/chat/sessions` lists the user's sessions;
`DELETE /api/chat/sessions?id=` removes one (cascades to messages and plans).

Crisis handling is not reimplemented in the web layer. `ml-service` owns
detection; the web persists and forwards the verdict. This keeps a single
source of truth for a safety-critical path.

## Auth

Email + password, matching Flutter's `signUp` / `signInWithPassword`, plus
password reset via `resetPasswordForEmail`.

Google and Apple OAuth are **out of scope**. Flutter offers them, but enabling
them requires Supabase dashboard provider configuration that only the user can
perform. `app/auth/callback/route.ts` is written generically, so adding a
provider later is a button plus one action — no restructuring.

Guarding: `app/[lang]/(app)/chat/page.tsx` performs a server-side
`getUser()` check and redirects to `/{lang}/login` when absent. The guard lives
in the layout/page, not only in `proxy.ts`, so a proxy misconfiguration cannot
silently expose the route.

## Copy

`lib/dictionaries/types.ts` gains typed `auth` and `chat` sections, with EN and
BM values added to both dictionaries. The unstyled pages read from the
dictionary rather than hardcoding English, so the user's restyle inherits
bilingual copy. BM strings need the same native-speaker review already pending
for the rest of the site.

## Error handling

- Missing/expired session on any `/api/chat/*` route → 401, never a redirect
  (these are fetch targets, not navigations).
- `ml-service` unreachable or non-2xx → 502 with a short message. The user's
  message is already persisted at that point, so the conversation is not lost.
- `ml-service` cold start → server-side timeout set well above Render's ~50 s
  spin-up rather than the platform default.
- Supabase write failure after a successful ML call → return the reply with a
  `persisted: false` flag rather than failing the whole request. Losing a
  database row must not look to the user like the chatbot broke. This is the
  web-side fix for the poor UX recorded in `HANDOFF.md`, where a failed write
  rendered a raw exception under a correct result.

## Verification

`web/` has no test framework, consistent with the rest of this repo (which uses
standalone scripts, e.g. `ml-service/scripts/test_fusion.py`). Introducing one
is out of scope for this work.

`scripts/smoke-auth-chat.mjs`:

1. Signs up a throwaway user against the live Supabase project.
2. Signs in, drives `/api/chat/reply` twice and `/api/chat/analyze` once.
3. Asserts rows landed in `mood_logs`, `chat_messages`, and `self_care_plans`
   with the expected roles and types.
4. Asserts RLS actually isolates users — a second user must not read the first
   user's session.
5. Deletes the throwaway data.

Plus a Playwright pass over the real pages: sign up, sign out, sign in, send a
message, request a plan, confirm the guard redirects when signed out.

Results are reported as actual output. A failing step is reported as failing.

## Open questions resolved during implementation, not assumed

1. **Is email confirmation enabled on this Supabase project?** Determines
   whether signup redirects to chat or to a "check your inbox" state. To be
   established by an actual throwaway signup, not guessed.
2. **Render cold-start latency on first call.** Sets the concrete fetch timeout
   value.

## Out of scope

- OAuth providers (needs dashboard config).
- Voice input on the web. `ml-service` exposes `/analyze/audio` and the schema
  supports `source: 'voice'|'both'`, but browser recording is a frontend
  concern and belongs with the user's design work.
- Mood history and plan-tracking pages.
- Any change to the Flutter app or `ml-service`.
- A test framework for `web/`.
- Vercel cutover (Root Directory → `web`, delete root `vercel.json`) — tracked
  separately.

## Consequences

- Adding voice later means one more route handler; the persistence layer
  already accepts `source` and `audio_result`.
- Both clients write the same schema, so a session started on the web is
  readable by the Flutter app and vice versa.
- Because writes are server-side on the web and client-side in Flutter, the
  two persistence paths must be kept in sync by hand. `lib/chat/sessions.ts`
  documents `session_service.dart` as its counterpart.
