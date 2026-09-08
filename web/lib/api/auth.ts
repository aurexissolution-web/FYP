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
  return user ? { id: user.id, email: user.email ?? null } : null;
}
