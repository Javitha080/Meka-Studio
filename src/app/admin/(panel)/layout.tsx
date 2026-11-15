import type { Metadata } from "next";
import type { ReactNode } from "react";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio CMS", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const [row] = await db.select({ n: count() }).from(bookings).where(eq(bookings.status, "new")).catch(() => [{ n: 0 }]);
  return (
    <div className="min-h-screen md:flex">
      <AdminNav name={session.name} role={session.role} newCount={row?.n ?? 0} />
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">{children}</main>
    </div>
  );
}
