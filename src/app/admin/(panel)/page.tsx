import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { CheckCircle2, Circle } from "lucide-react";
import { db } from "@/db";
import { bookings, emailLogs, mediaAssets, projects, services, subscribers, testimonials } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { seedAction } from "@/app/admin/actions";
import { isMailConfigured } from "@/lib/mail/mailgun";
import { isStorageConfigured, isSupabaseConfigured } from "@/lib/supabase/env";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const session = await requireAdmin();
  const { denied } = await searchParams;
  const [[b], [nb], [p], [s], [t], [m], [sub], [failed], recent] = await Promise.all([
    db.select({ n: count() }).from(bookings),
    db.select({ n: count() }).from(bookings).where(eq(bookings.status, "new")),
    db.select({ n: count() }).from(projects),
    db.select({ n: count() }).from(services),
    db.select({ n: count() }).from(testimonials),
    db.select({ n: count() }).from(mediaAssets),
    db.select({ n: count() }).from(subscribers).where(eq(subscribers.status, "subscribed")),
    db.select({ n: count() }).from(emailLogs).where(eq(emailLogs.status, "failed")),
    db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(5),
  ]);

  const stats = [
    ["New requests", nb.n, "/admin/bookings?status=new", true],
    ["All bookings", b.n, "/admin/bookings", false],
    ["Projects", p.n, "/admin/projects", false],
    ["Media files", m.n, "/admin/media", false],
    ["Subscribers", sub.n, "/admin/subscribers", false],
    ["Testimonials", t.n, "/admin/testimonials", false],
  ] as const;

  const checks = [
    ["Supabase Auth connected", isSupabaseConfigured()],
    ["Storage uploads enabled (service key)", isStorageConfigured()],
    ["Mailgun configured", isMailConfigured()],
    ["Site URL set (NEXT_PUBLIC_SITE_URL)", Boolean(process.env.NEXT_PUBLIC_SITE_URL)],
    ["Mailgun webhook secret (delivery tracking)", Boolean(process.env.MAILGUN_WEBHOOK_SIGNING_KEY)],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      {denied && <p className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">That area is for owners only.</p>}
      <div className="label mb-2">Welcome back</div>
      <h1 className="mb-10 text-4xl font-black uppercase tracking-tight text-silver-grad">{session.name}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, n, href, hot]) => (
          <Link key={label} href={href} className={`glass rounded-3xl p-5 transition-transform hover:-translate-y-1 ${hot && n > 0 ? "!border-signal/60" : ""}`}>
            <div className={`text-4xl font-black ${hot && n > 0 ? "text-signal" : ""}`}>{n}</div>
            <div className="label mt-2">{label}</div>
          </Link>
        ))}
      </div>

      {p.n === 0 && s.n === 0 && (
        <form action={seedAction} className="glass mt-8 rounded-3xl border-signal/40 p-6">
          <p className="mb-4 text-silver">The CMS is empty. Import your starter content (services, prices, FAQ and sample portfolio) to begin editing.</p>
          <button className="btn btn-primary">Import starter content</button>
        </form>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="mb-4 text-xl font-extrabold uppercase tracking-wide">Latest requests</h2>
          <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10">
            {recent.length === 0 && <li className="p-8 text-center text-mute">No booking requests yet.</li>}
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 bg-white/[0.02] px-5 py-4">
                <div>
                  <div className="font-bold">{r.name}</div>
                  <div className="font-mono text-xs text-mute">
                    {r.shootType} · {r.preferredDate || "no date"}
                  </div>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 font-mono text-[11px] uppercase text-silver">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-4 text-xl font-extrabold uppercase tracking-wide">Setup checklist</h2>
          <ul className="glass grid gap-3 rounded-3xl p-5 text-sm">
            {checks.map(([label, ok]) => (
              <li key={label} className="flex items-center gap-3">
                {ok ? <CheckCircle2 className="h-4 w-4 text-signal" aria-hidden /> : <Circle className="h-4 w-4 text-mute" aria-hidden />}
                <span className={ok ? "text-silver" : "text-mute"}>{label}</span>
              </li>
            ))}
            {failed.n > 0 && (
              <li>
                <Link href="/admin/emails" className="text-red-300 underline underline-offset-4">
                  {failed.n} e-mail(s) failed — review
                </Link>
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
