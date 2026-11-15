import { asc } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { removeTeamMemberAction } from "@/app/admin/actions";
import { TeamForm } from "@/components/admin/forms";
import { requireOwner } from "@/lib/auth";

export default async function TeamAdmin() {
  const me = await requireOwner();
  const rows = await db.select().from(profiles).orderBy(asc(profiles.createdAt));
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">Team</h1>
      <p className="mb-8 text-sm text-mute">Only people listed here can enter the CMS. Accounts live in Supabase Auth; new members get a password-setup e-mail.</p>
      <TeamForm />
      <ul className="mt-8 divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-4 bg-white/[0.02] px-5 py-4">
            <div className="min-w-0">
              <div className="truncate font-bold">{r.name || r.email}</div>
              <div className="truncate font-mono text-xs text-mute">{r.email}</div>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-0.5 font-mono text-[10px] uppercase text-silver">{r.role}</span>
            {r.id !== me.userId && (
              <form action={removeTeamMemberAction}>
                <input type="hidden" name="id" value={r.id} />
                <button aria-label={`Remove ${r.email}`} className="rounded-full p-2 text-mute hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
