import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Fixed-window rate limiter backed by Postgres (works across serverless
 * instances / Cloudflare Workers). Single atomic upsert — no race conditions.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  try {
    const res = await db.execute(sql`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, now() + (${windowSec} * interval '1 second'))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at <= now() THEN now() + (${windowSec} * interval '1 second') ELSE rate_limits.reset_at END
      RETURNING count, EXTRACT(EPOCH FROM (reset_at - now()))::int AS ttl
    `);
    // postgres.js returns the RowList array directly (no `.rows` wrapper).
    const row = res[0] as { count: number; ttl: number } | undefined;
    const count = Number(row?.count ?? 1);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSec: Math.max(1, Number(row?.ttl ?? windowSec)),
    };
  } catch {
    // Fail open on infra errors so a DB hiccup never blocks real clients.
    return { allowed: true, remaining: limit, retryAfterSec: 0 };
  }
}
