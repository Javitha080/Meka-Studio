import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import * as schema from "./schema";

/**
 * Resolve the database URL. At runtime on Cloudflare Workers the Hyperdrive
 * binding terminates TLS to Supabase and exposes a plain local connection
 * string (postgres.js's mid-connection TLS upgrade does not work in workerd).
 * Outside a Worker context (next build prerender) getCloudflareContext throws
 * and we fall back to DATABASE_URL — the Supabase transaction pooler with TLS.
 */
function resolveUrl(): { url: string; viaHyperdrive: boolean } {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  try {
    const env = getCloudflareContext().env as { HYPERDRIVE?: { connectionString?: string } };
    if (env.HYPERDRIVE?.connectionString) return { url: env.HYPERDRIVE.connectionString, viaHyperdrive: true };
  } catch {
    // Not running inside a Cloudflare Worker (build/prerender on Node).
  }
  return { url, viaHyperdrive: false };
}

function createClient() {
  const { url, viaHyperdrive } = resolveUrl();
  const isLocal = /@(127\.0\.0\.1|localhost|\[::1\])/.test(url);
  return postgres(url, {
    // Supavisor transaction pooler and Hyperdrive both pool connections —
    // named prepared statements cannot be matched across them.
    prepare: false,
    // Supabase requires TLS on direct connections; Hyperdrive already handles
    // TLS on Cloudflare's side, so its local connection stays plain.
    ssl: viaHyperdrive || isLocal ? false : "require",
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    idle_timeout: 10,
    connect_timeout: 8,
  });
}

/**
 * One client per server request. React `cache` memoizes the client for a single
 * request scope (page render, server action or route handler).
 */
export const getDb = cache((): PostgresJsDatabase<typeof schema> => drizzle(createClient(), { schema }));

/**
 * Request-scoped drizzle client. Every property access resolves to the current
 * request's client, so `import { db } from "@/db"` keeps working everywhere.
 */
export const db: PostgresJsDatabase<typeof schema> = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const client = getDb() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
