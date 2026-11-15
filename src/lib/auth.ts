import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type AdminRole } from "@/db/schema";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
}

/** Comma-separated e-mails that are auto-promoted to owner on first sign-in. */
export function isBootstrapAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * Verifies the Supabase session with the Auth server (getUser — never trusts the raw cookie)
 * and checks the user is on the CMS allow-list (`profiles`).
 */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return null;
    const email = data.user.email.toLowerCase();

    let [profile] = await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1);
    if (!profile && isBootstrapAdmin(email)) {
      [profile] = await db
        .insert(profiles)
        .values({ id: data.user.id, email, name: String(data.user.user_metadata?.name ?? email.split("@")[0]), role: "owner" })
        .onConflictDoNothing()
        .returning();
    }
    if (!profile) return null;
    return { userId: profile.id, email: profile.email, name: profile.name || profile.email, role: profile.role };
  } catch {
    return null;
  }
});

/** Use at the top of every admin page / server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireOwner(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (session.role !== "owner") redirect("/admin?denied=1");
  return session;
}
