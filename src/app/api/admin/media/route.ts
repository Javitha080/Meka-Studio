import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/security";
import { ALLOWED_UPLOADS, PATH_RE, publicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

const err = (message: string, status: number) => Response.json({ ok: false, error: message }, { status });

/** Media library listing (used by the picker). */
export async function GET(req: Request) {
  if (!(await getSession())) return err("Unauthorized", 401);
  const kind = new URL(req.url).searchParams.get("kind");
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(kind === "image" || kind === "video" ? eq(mediaAssets.kind, kind) : undefined)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(120);
  return Response.json({ ok: true, items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}

/** Step 3 of an upload: records the finished object in the media library. */
export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return err("Forbidden", 403);
  if (!(await getSession())) return err("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as { path?: string; name?: string; mime?: string; size?: number } | null;
  const path = String(body?.path ?? "");
  const mime = String(body?.mime ?? "");
  if (!PATH_RE.test(path) || !ALLOWED_UPLOADS[mime]) return err("Invalid media record.", 400);

  const [row] = await db
    .insert(mediaAssets)
    .values({
      url: publicUrl(path),
      path,
      name: String(body?.name ?? "upload").slice(0, 255),
      mime,
      kind: ALLOWED_UPLOADS[mime].kind,
      size: Math.max(0, Math.floor(Number(body?.size ?? 0))),
    })
    .returning();
  return Response.json({ ok: true, item: { ...row, createdAt: row.createdAt.toISOString() } });
}
