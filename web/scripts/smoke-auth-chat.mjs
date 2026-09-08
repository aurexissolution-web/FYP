// End-to-end smoke test against a running dev server and the live Supabase +
// ml-service deployments.
//
// Run: npm run dev -- -p 3003    (in another terminal)
//      node --env-file=.env.local scripts/smoke-auth-chat.mjs
//
// Creates two throwaway users, drives the full chat flow as user A, asserts
// the rows landed, and asserts user B cannot read user A's session.
// It deletes its own rows but cannot delete the auth users — see README.md.
//
// REQUIRES email confirmation to be OFF in the Supabase dashboard
// (Authentication -> Providers -> Email -> "Confirm email"). With it on,
// signUp returns no session and this script cannot authenticate at all.

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
  a: { email: `emobuddy-smoke-${stamp}-a@mailinator.com`, password: "Smoke-Passw0rd!" },
  b: { email: `emobuddy-smoke-${stamp}-b@mailinator.com`, password: "Smoke-Passw0rd!" },
};

/** Signs a user up and returns a client plus their live session. */
async function makeUser(creds) {
  const client = createClient(SUPA, ANON);
  const { error: signUpError } = await client.auth.signUp(creds);
  if (signUpError) throw new Error(`signUp failed: ${signUpError.message}`);

  const { data, error } = await client.auth.signInWithPassword(creds);
  if (error) {
    throw new Error(
      `signIn failed: ${error.message}\n` +
        "If this says 'Email not confirmed', turn off Confirm email in the " +
        "Supabase dashboard — see the note at the top of this file.",
    );
  }
  return { client, userId: data.user.id, session: data.session };
}

// @supabase/ssr stores the session as `base64-<base64url(JSON)>` under
// `sb-<ref>-auth-token`, splitting into `.0`, `.1`, ... above 3180 bytes.
// Verified against node_modules/@supabase/ssr/dist/main/cookies.js.
const MAX_CHUNK_SIZE = 3180;

function authCookie(session) {
  const ref = new URL(SUPA).hostname.split(".")[0];
  const name = `sb-${ref}-auth-token`;
  const value =
    "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");

  if (value.length <= MAX_CHUNK_SIZE) return `${name}=${value}`;

  const chunks = [];
  for (let i = 0; i < value.length; i += MAX_CHUNK_SIZE) {
    chunks.push(`${name}.${chunks.length}=${value.slice(i, i + MAX_CHUNK_SIZE)}`);
  }
  return chunks.join("; ");
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

// --- 5. Sessions API -----------------------------------------------------
const listed = await api("/api/chat/sessions", { method: "GET", user: a });
const listedBody = await listed.json();
check("sessions list includes this session", listedBody.sessions?.some((s) => s.id === sessionId));

// --- 6. RLS isolation ----------------------------------------------------
const b = await makeUser(users.b);
const { data: leaked } = await b.client
  .from("chat_messages")
  .select("id")
  .eq("session_id", sessionId);
check("user B cannot read user A's messages", (leaked ?? []).length === 0, `saw ${(leaked ?? []).length} rows`);

const leakedApi = await api("/api/chat/sessions", { method: "GET", user: b });
const leakedApiBody = await leakedApi.json();
check("user B's session list excludes user A's session", !leakedApiBody.sessions?.some((s) => s.id === sessionId));

// --- 7. Cleanup ----------------------------------------------------------
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
