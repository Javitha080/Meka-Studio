import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic route: surfaces what the Hyperdrive binding exposes and
 * how a raw socket connect to it behaves. Delete after the DB path is proven.
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
      const u = new URL(cs);
      const { connect } = await import("cloudflare:sockets");
      const socket = connect(
        { hostname: u.hostname, port: Number(u.port || 5432) },
        { secureTransport: "off", allowHalfOpen: false },
      );
      const opened = socket.opened.then(
        () => "opened",
        (e: unknown) => "openError: " + (e instanceof Error ? e.message : String(e)),
      );
      out.socketOpen = await Promise.race([
        opened,
        new Promise((r) => setTimeout(() => r("TIMEOUT_5S"), 5000)),
      ]);
      socket.close().catch(() => {});
    } catch (e) {
      out.socketError = e instanceof Error ? e.message : String(e);
    }

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
