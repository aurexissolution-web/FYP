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
