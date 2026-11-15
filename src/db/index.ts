import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cache } from "react";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const isLocal = databaseUrl ? /@(127\.0\.0\.1|localhost|\[::1\])/.test(databaseUrl) : false;

function createClient() {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  return postgres(databaseUrl, {
    // Supavisor transaction pooler (port 6543) can swap backend connections
    // between queries, so named prepared statements break — keep them unnamed.
    prepare: false,
    // Supabase requires TLS outside local dev. "require" = encrypt without
    // certificate verification, matching the previous pg setup.
    ssl: isLocal ? false : "require",
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    idle_timeout: 10,
    connect_timeout: 8,
  });
}

/**
 * One client per server request. React `cache` memoizes the client for a single
 * request scope (page render, server action or route handler). Do NOT hoist
 * this to module scope — Workers forbid reusing TCP connections across requests.
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
