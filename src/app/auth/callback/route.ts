import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** PKCE code exchange landing for Supabase auth e-mails / OAuth. */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/admin";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin";
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.url));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", req.url));
}
