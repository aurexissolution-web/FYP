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
