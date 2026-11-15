import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Edge gate for /admin: refreshes the Supabase session cookies and keeps anonymous
 * visitors away from CMS pages. Authorisation (allow-list) is re-checked server-side
 * by `requireAdmin()` in every page, action and route handler.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const isPublicAdminPath = pathname.startsWith("/admin/login") || pathname.startsWith("/admin/reset-password");

  let res = NextResponse.next({ request: req });
  if (!url || !key) return res; // not configured → the login page explains what to set up

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (pathname.startsWith("/admin") && !isPublicAdminPath && !data?.claims) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }
  return res;
}

export const config = { matcher: ["/admin/:path*", "/auth/:path*"] };
