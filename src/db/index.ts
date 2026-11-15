import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Resolve the database URL. At runtime on Cloudflare Workers the Hyperdrive
 * binding terminates TLS to Supabase and exposes a plain local connection
 * string (postgres.js's mid-connection TLS upgrade does not work in workerd).
 * Outside a Worker context (next build prerender) getCloudflareContext throws
 * and we fall back to DATABASE_URL — the Supabase transaction pooler with TLS.
 */
function resolveUrl(): string {
  const fallback = process.env.DATABASE_URL;
  if (!fallback) throw new Error("DATABASE_URL is required");
  try {
    const env = getCloudflareContext().env as { HYPERDRIVE?: { connectionString?: string } };
    if (env.HYPERDRIVE?.connectionString) return env.HYPERDRIVE.connectionString;
  } catch {
    // Not running inside a Cloudflare Worker (build/prerender on Node).
  }
  return fallback;
}

type WaitUntilContext = { ctx?: { waitUntil: (promise: Promise<unknown>) => void } };

function createClient() {
  const url = resolveUrl();
  const parsed = new URL(url);
  const isLocal = /@(127\.0\.0\.1|localhost|\[::1\])/.test(url);
  // Hyperdrive's local socket is plain (its URL says sslmode=disable) — TLS
  // already terminates on Cloudflare's side. Supabase direct URLs need TLS.
  const noTls =
    isLocal ||
    parsed.hostname.endsWith(".workers.alt") ||
    parsed.searchParams.get("sslmode") === "disable";
  const client = postgres(url, {
    // Supavisor transaction pooler and Hyperdrive both pool connections —
    // named prepared statements cannot be matched across them.
    prepare: false,
    ssl: noTls ? false : "require",
    max: Number(process.env.DATABASE_POOL_MAX ?? 2),
    idle_timeout: 10,
    connect_timeout: 8,
  });

  /**
   * Sockets and timers created in a Worker request context die with it. Close
   * the client in the same context (waitUntil runs after the response but
   * inside this request), so postgres.js's idle/retry timers can never fire
   * after the request has ended — those settlements get dropped under the
   * strict cross-request promise semantics and wedge later requests.
   */
  try {
    const { ctx } = getCloudflareContext() as WaitUntilContext;
    ctx?.waitUntil(client.end({ timeout: 2 }).catch(() => {}));
  } catch {
    // No Worker context (Node dev/build) — idle_timeout cleans up instead.
  }

  return client;
}

/**
 * One client per query chain. Deliberately NOT memoized with React `cache()`:
 * under OpenNext on workerd a cache()-scoped client can be reached by a later
 * request, making it await promises bound to a request that already ended —
 * those can never settle and the render hangs forever.
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  return drizzle(createClient(), { schema });
}

/**
 * Request-scoped drizzle client. Every property access resolves to a fresh
 * client for the current chain, so `import { db } from "@/db"` keeps working
 * everywhere.
 */
export const db: PostgresJsDatabase<typeof schema> = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const client = getDb() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
