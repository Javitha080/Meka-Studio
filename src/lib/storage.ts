import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { storageBucket, supabaseUrl } from "@/lib/supabase/env";

export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 50);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ALLOWED_UPLOADS: Record<string, { ext: string; kind: "image" | "video" }> = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/avif": { ext: "avif", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
};

export const objectPath = (mime: string) => {
  const now = new Date();
  const ext = ALLOWED_UPLOADS[mime]?.ext ?? "bin";
  return `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
};

export const PATH_RE = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.[a-z0-9]{2,4}$/;

export const publicUrl = (path: string) => `${supabaseUrl()}/storage/v1/object/public/${storageBucket()}/${path}`;

let ensured = false;
/** Creates the public media bucket (with MIME + size limits) on first use. */
export async function ensureBucket() {
  if (ensured) return;
  const admin = createSupabaseAdminClient();
  const bucket = storageBucket();
  const { data } = await admin.storage.getBucket(bucket);
  if (!data) {
    const { error } = await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_UPLOAD_BYTES,
      allowedMimeTypes: Object.keys(ALLOWED_UPLOADS),
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  ensured = true;
}
