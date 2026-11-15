import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/security";
import { ALLOWED_UPLOADS, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, ensureBucket, objectPath } from "@/lib/storage";
import { isStorageConfigured, storageBucket, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const err = (message: string, status: number) => Response.json({ ok: false, error: message }, { status });

/**
 * Step 1 of a direct-to-storage upload: validates the request and returns a one-time signed
 * upload URL. The browser then PUTs the file straight to Supabase Storage, so large videos never
 * pass through (or hit the body-size limits of) this server.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return err("Forbidden", 403);
  const session = await getSession();
  if (!session) return err("Unauthorized", 401);

  const limit = await rateLimit(`upload:${session.userId}`, 120, 600);
  if (!limit.allowed) return err("Too many uploads. Slow down.", 429);

  if (!isStorageConfigured()) {
    return err(
      "Uploads are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or paste a media URL instead.",
      501,
    );
  }

  const body = (await req.json().catch(() => null)) as { mime?: string; size?: number; name?: string } | null;
  const mime = String(body?.mime ?? "");
  const size = Number(body?.size ?? 0);
  if (!ALLOWED_UPLOADS[mime]) return err("Unsupported file type. Use JPG, PNG, WebP, AVIF, GIF, MP4, WebM or MOV.", 415);
  if (!(size > 0)) return err("Empty file.", 400);
  if (size > MAX_UPLOAD_BYTES) return err(`File is larger than ${MAX_UPLOAD_MB} MB.`, 413);

  try {
    await ensureBucket();
    const path = objectPath(mime);
    const { data, error } = await createSupabaseAdminClient().storage.from(storageBucket()).createSignedUploadUrl(path);
    if (error || !data) return err("Could not prepare the upload.", 502);
    return Response.json({ ok: true, path, signedUrl: data.signedUrl, anonKey: supabaseAnonKey(), supabaseUrl: supabaseUrl() });
  } catch {
    return err("Storage is unavailable. Check your Supabase keys.", 502);
  }
}
