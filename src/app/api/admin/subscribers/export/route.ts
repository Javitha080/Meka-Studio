import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const rows = await db.select().from(subscribers).where(eq(subscribers.status, "subscribed")).orderBy(desc(subscribers.createdAt));
  // Prefix risky leading chars so spreadsheet apps can't run formulas.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const csv = ["email,source,subscribed_at", ...rows.map((r) => [cell(r.email), cell(r.source), r.createdAt.toISOString()].join(","))].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="subscribers.csv"', "Cache-Control": "no-store" },
  });
}
