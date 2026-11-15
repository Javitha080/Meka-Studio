import { desc } from "drizzle-orm";
import { Download, Trash2 } from "lucide-react";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { deleteSubscriberAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";

export default async function SubscribersAdmin() {
  await requireAdmin();
  const rows = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(1000);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">Subscribers</h1>
          <p className="text-sm text-mute">{rows.filter((r) => r.status === "subscribed").length} active · collected from the footer newsletter form.</p>
        </div>
        <a href="/api/admin/subscribers/export" className="btn btn-ghost !px-6 !py-3">
          <Download className="h-4 w-4" aria-hidden /> Export CSV
        </a>
      </div>
      <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10">
        {rows.length === 0 && <li className="p-8 text-center text-mute">No subscribers yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-4 bg-white/[0.02] px-5 py-3.5">
            <div className="min-w-0">
              <div className="truncate font-semibold">{r.email}</div>
              <div className="font-mono text-xs text-mute">{r.createdAt.toLocaleDateString()} · {r.source}</div>
            </div>
            <span className={`rounded-full border px-3 py-0.5 font-mono text-[10px] uppercase ${r.status === "subscribed" ? "border-signal/50 text-signal" : "border-white/20 text-mute"}`}>{r.status}</span>
            <form action={deleteSubscriberAction}>
              <input type="hidden" name="id" value={r.id} />
              <button aria-label={`Delete ${r.email}`} className="rounded-full p-2 text-mute hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
