import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { BOOKING_STATUSES, bookings } from "@/db/schema";
import { BookingCard, type BookingRow } from "@/components/admin/forms";
import { requireAdmin } from "@/lib/auth";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const valid = BOOKING_STATUSES.find((s) => s === status);
  const rows = await db
    .select()
    .from(bookings)
    .where(valid ? eq(bookings.status, valid) : undefined)
    .orderBy(desc(bookings.createdAt))
    .limit(200);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-4xl font-black uppercase tracking-tight text-silver-grad">Bookings</h1>
      <div className="mb-8 flex flex-wrap gap-2">
        {[undefined, ...BOOKING_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/bookings?status=${s}` : "/admin/bookings"}
            className={`rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest ${
              valid === s ? "border-signal bg-signal text-black" : "border-white/15 text-mute hover:text-white"
            }`}
          >
            {s ?? "all"}
          </Link>
        ))}
      </div>
      <div className="grid gap-5">
        {rows.length === 0 && <p className="rounded-3xl border border-white/10 p-10 text-center text-mute">No bookings here.</p>}
        {rows.map((r) => {
          const digits = r.phone.replace(/\D/g, "");
          const wa = digits ? `https://wa.me/${digits.startsWith("0") ? `94${digits.slice(1)}` : digits}` : null;
          const row: BookingRow = {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            shootType: r.shootType,
            preferredDate: r.preferredDate,
            location: r.location,
            message: r.message,
            status: r.status,
            notes: r.notes,
            createdAt: r.createdAt.toISOString(),
          };
          return <BookingCard key={r.id} b={row} statuses={BOOKING_STATUSES} waLink={wa} />;
        })}
      </div>
    </div>
  );
}
