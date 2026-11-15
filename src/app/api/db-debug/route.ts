import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic route: surfaces what the Hyperdrive binding exposes and
 * whether a postgres.js connection over it works. Delete after proven.
 */
export async function GET() {
  const out: Record<string, unknown> = {};

  let cs = "";
  try {
    const env = getCloudflareContext().env as {
      HYPERDRIVE?: { connectionString?: string };
    };
    cs = env.HYPERDRIVE?.connectionString ?? "";
    out.hasHyperdrive = Boolean(cs);
    // Mask credentials, keep host/port visible.
    out.connectionStringMasked = cs.replace(/\/\/[^@]*@/, "//***@");
  } catch (e) {
    out.contextError = e instanceof Error ? e.message : String(e);
  }

  if (cs) {
    try {
      const sql = postgres(cs, { prepare: false, ssl: false, max: 1, connect_timeout: 4, idle_timeout: 5 });
      const t0 = Date.now();
      const rows = await sql`select 1 as one`;
      out.pgQuery = { ok: true, ms: Date.now() - t0, rows: rows as unknown[] };
      await sql.end({ timeout: 2 });
    } catch (e) {
      out.pgError = e instanceof Error ? e.message : String(e);
    }
  }

  return Response.json(out);
}
