import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseServiceKey, supabaseUrl } from "./env";

/** Cookie-bound Supabase client for Server Components, Route Handlers and Server Actions. */
export async function createSupabaseServerClient() {
  const jar = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          /* called from a Server Component – the proxy refreshes the session instead */
        }
      },
    },
  });
}

/** Service-role client (bypasses RLS). SERVER ONLY — never import from a client component. */
export function createSupabaseAdminClient() {
  return createClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
