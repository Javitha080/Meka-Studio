import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetForm } from "@/components/admin/forms";
import { CameraMark } from "@/components/site/Nav";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured()) redirect("/admin/login");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login?error=link");
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="glass w-full max-w-md rounded-[28px] p-8 md:p-10">
        <div className="mb-8 flex items-center gap-3 text-silver">
          <CameraMark className="h-9 w-9" />
          <div className="text-sm font-extrabold uppercase tracking-[0.28em]">Set a new password</div>
        </div>
        <ResetForm />
      </div>
    </main>
  );
}
