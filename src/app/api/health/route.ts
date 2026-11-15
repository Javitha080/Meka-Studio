import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Race the query so a wedged connection can never hang the route; the
    // deadline must exceed postgres.js's connect_timeout (8s).
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("health query timed out (20s)")), 20_000),
    );
    await Promise.race([db.execute(sql`select 1`), timeout]);
    return Response.json({ ok: true });
  } catch (e) {
    const cause = (e as { cause?: unknown } | undefined)?.cause ?? e;
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
