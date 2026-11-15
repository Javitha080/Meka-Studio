import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (e) {
    // Drizzle wraps driver errors in `cause`; surface the root message so the
    // production health check is diagnosable without runtime log access.
    const cause = (e as { cause?: unknown } | undefined)?.cause ?? e;
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
