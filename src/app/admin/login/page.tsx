import type { Metadata } from "next";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { ForgotForm, LoginForm, SetupForm } from "@/components/admin/forms";
import { CameraMark } from "@/components/site/Nav";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio login", robots: { index: false, follow: false } };

const ENV_HELP = [
  ["NEXT_PUBLIC_SUPABASE_URL", "Project URL (Settings → API)"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon / publishable key"],
  ["SUPABASE_SERVICE_ROLE_KEY", "service_role key — server only (uploads + owner setup)"],
  ["DATABASE_URL", "Supabase Postgres connection string (Settings → Database)"],
  ["SETUP_TOKEN or ADMIN_EMAILS", "lets you create / auto-promote the first owner"],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string }> }) {
  const sp = await searchParams;
  const configured = isSupabaseConfigured();
  if (configured && (await getSession())) redirect("/admin");

  let profileCount = 1;
  let dbError = false;
  if (configured) {
    try {
      const [{ n }] = await db.select({ n: count() }).from(profiles);
      profileCount = n;
    } catch {
      dbError = true;
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <div aria-hidden className="absolute left-1/2 top-1/4 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-signal/10 blur-[120px]" />
      <div className="glass w-full max-w-md rounded-[28px] p-8 md:p-10">
        <div className="mb-8 flex items-center gap-3 text-silver">
          <CameraMark className="h-9 w-9" />
          <div>
            <div className="text-sm font-extrabold uppercase tracking-[0.28em]">Meka Studio</div>
            <div className="label">{profileCount === 0 ? "First-time setup" : "Studio CMS · Supabase Auth"}</div>
          </div>
        </div>
        {!configured ? (
          <div className="grid gap-4 text-sm">
            <p className="text-silver">Supabase Auth is not connected yet. Add these environment variables, then redeploy:</p>
            <ul className="grid gap-2">
              {ENV_HELP.map(([k, v]) => (
                <li key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <code className="text-signal">{k}</code>
                  <div className="text-xs text-mute">{v}</div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-mute">
              Then run <code>npx drizzle-kit push</code> against your Supabase database. See <code>README.md</code> for the full guide.
            </p>
          </div>
        ) : dbError ? (
          <p className="text-red-300">Database unavailable. Check DATABASE_URL, run <code>npx drizzle-kit push</code> and refresh.</p>
        ) : profileCount === 0 ? (
          <>
            <p className="mb-6 text-sm text-mute">Create the owner account. This form disappears once an owner exists.</p>
            <SetupForm needsToken={Boolean(process.env.SETUP_TOKEN)} />
          </>
        ) : (
          <div className="grid gap-8">
            {sp.error === "link" && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">That link has expired. Request a new one below.</p>}
            <LoginForm />
            <div className="border-t border-white/10 pt-6">
              <ForgotForm />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
