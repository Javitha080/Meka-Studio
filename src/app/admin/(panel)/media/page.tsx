import { desc } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { MediaLibrary, type MediaItem } from "@/components/admin/media";
import { requireAdmin } from "@/lib/auth";
import { MAX_UPLOAD_MB } from "@/lib/storage";
import { isStorageConfigured, isSupabaseConfigured } from "@/lib/supabase/env";

export default async function MediaAdmin() {
  await requireAdmin();
  const rows = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(300);
  const items: MediaItem[] = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">Media library</h1>
      <p className="mb-8 max-w-2xl text-sm text-mute">
        Upload photos and videos straight to Supabase Storage (max {MAX_UPLOAD_MB} MB each). Files upload directly from your browser with live progress, then can be picked in any media field.
      </p>
      <MediaLibrary initial={items} configured={isSupabaseConfigured() && isStorageConfigured()} />
    </div>
  );
}
