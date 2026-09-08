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

Shell scripts: `./scripts/<name>.sh`
`check-ml-wrapper.mjs`: `npx tsx --env-file=.env.local scripts/check-ml-wrapper.mjs`
(it imports a `.ts` module, so plain `node` cannot run it)
`smoke-auth-chat.mjs`: `node --env-file=.env.local scripts/smoke-auth-chat.mjs`

## smoke-auth-chat.mjs needs email confirmation turned OFF

This project currently has `mailer_autoconfirm: false` — signing up sends a
confirmation email and returns no session, so the script cannot authenticate.
Supabase's built-in mailer also rate-limits to a handful of messages per hour,
which blocks signup outright once exhausted.

Turn it off at **Authentication → Providers → Email → "Confirm email"** in the
Supabase dashboard. That is also what the demo needs: with confirmation on, a
visitor at the booth cannot create an account.

The script creates throwaway users it **cannot delete** — removing an auth user
needs a service-role key, which this codebase deliberately does not carry.
Delete `emobuddy-smoke-*@mailinator.com` from the Supabase dashboard
periodically.
