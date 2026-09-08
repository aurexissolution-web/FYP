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
