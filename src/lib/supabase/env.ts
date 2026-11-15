/** Supabase configuration helpers. Public values are safe for the browser; the service key is server-only. */
export const supabaseUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
export const supabaseAnonKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
export const supabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const storageBucket = () => process.env.SUPABASE_BUCKET || "media";

export const isSupabaseConfigured = () => Boolean(supabaseUrl() && supabaseAnonKey());
export const isStorageConfigured = () => Boolean(supabaseUrl() && supabaseServiceKey());
