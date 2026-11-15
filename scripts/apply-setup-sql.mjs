import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

// Applies supabase/setup.sql (RLS + storage bucket) through the migration
// connection. Usage: node scripts/apply-setup-sql.mjs
const url =
  process.env.DATABASE_URL_MIGRATIONS ??
  process.env.DATABASE_URL ??
  (() => {
    // .env fallback when invoked without dotenv
    try {
      const env = readFileSync(".env", "utf8");
      return env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
    } catch {
      return undefined;
    }
  })();

if (!url) throw new Error("DATABASE_URL missing");

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});
await client.connect();

const sql = readFileSync(path.join("supabase", "setup.sql"), "utf8");
await client.query(sql);
const rls = await client.query(
  `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`
);
console.log("setup.sql applied. RLS state:");
for (const row of rls.rows) console.log(`  ${row.relname}: RLS ${row.relrowsecurity ? "ENABLED" : "disabled"}`);
const bucket = await client.query(`select id, public, file_size_limit from storage.buckets where id = 'media'`);
console.log("bucket:", JSON.stringify(bucket.rows[0] ?? null));
await client.end();
