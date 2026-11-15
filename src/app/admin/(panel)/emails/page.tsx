import { desc } from "drizzle-orm";
import { CheckCircle2, CircleAlert, Clock, MailX } from "lucide-react";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { clearEmailLogAction } from "@/app/admin/actions";
import { TestMailForm } from "@/components/admin/forms";
import { requireAdmin } from "@/lib/auth";
import { isMailConfigured } from "@/lib/mail/mailgun";

const STATUS: Record<string, { cls: string; icon: typeof Clock }> = {
  queued: { cls: "text-mute", icon: Clock },
  sent: { cls: "text-sky-300", icon: CheckCircle2 },
  delivered: { cls: "text-signal", icon: CheckCircle2 },
  opened: { cls: "text-signal", icon: CheckCircle2 },
  clicked: { cls: "text-signal", icon: CheckCircle2 },
  failed: { cls: "text-red-300", icon: CircleAlert },
  complained: { cls: "text-red-300", icon: CircleAlert },
  skipped: { cls: "text-amber-300", icon: MailX },
};

export default async function EmailsAdmin() {
  const session = await requireAdmin();
  const rows = await db.select().from(emailLogs).orderBy(desc(emailLogs.createdAt)).limit(100);
  const configured = isMailConfigured();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">E-mail log</h1>
      <p className="mb-8 text-sm text-mute">Every transactional message sent through Mailgun — booking alerts, confirmations, replies and newsletter welcomes.</p>

      <div className={`mb-6 rounded-2xl border p-4 text-sm ${configured ? "border-signal/40 bg-signal/10 text-signal" : "border-amber-400/40 bg-amber-400/10 text-amber-200"}`}>
        {configured ? (
          <>Mailgun connected · domain <code>{process.env.MAILGUN_DOMAIN}</code> · region <code>{(process.env.MAILGUN_REGION ?? "us").toUpperCase()}</code></>
        ) : (
          <>Mailgun is not configured. Set <code>MAILGUN_API_KEY</code>, <code>MAILGUN_DOMAIN</code> (and optionally <code>MAILGUN_REGION=eu</code>, <code>MAIL_FROM</code>). Bookings are still saved.</>
        )}
      </div>
      <TestMailForm defaultTo={session.email} />

      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="text-xl font-extrabold uppercase tracking-wide">Recent messages</h2>
        {session.role === "owner" && rows.length > 0 && (
          <form action={clearEmailLogAction}>
            <button className="label hover:text-red-400">Clear log</button>
          </form>
        )}
      </div>
      <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10">
        {rows.length === 0 && <li className="p-8 text-center text-mute">No e-mails yet.</li>}
        {rows.map((r) => {
          const s = STATUS[r.status] ?? STATUS.queued;
          const Icon = s.icon;
          return (
            <li key={r.id} className="flex items-start gap-4 bg-white/[0.02] px-5 py-3.5">
              <Icon className={`mt-1 h-4 w-4 shrink-0 ${s.cls}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{r.subject}</div>
                <div className="truncate font-mono text-xs text-mute">
                  {r.kind} → {r.toEmail} · {r.createdAt.toLocaleString()}
                </div>
                {r.error && <div className="mt-1 text-xs text-red-300">{r.error}</div>}
              </div>
              <span className={`font-mono text-[11px] uppercase ${s.cls}`}>{r.status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
