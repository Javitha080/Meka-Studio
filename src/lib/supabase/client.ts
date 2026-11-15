"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client (anon key only). Used for direct-to-storage uploads with server-signed tokens. */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return createBrowserClient(url, key);
}
