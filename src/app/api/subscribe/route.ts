import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { getSettings } from "@/lib/content";
import { sendMail } from "@/lib/mail/mailgun";
import { welcomeMail } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/rate-limit";
import { generateToken, getClientIp, isSameOrigin } from "@/lib/security";
import { subscribeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return json({ ok: false, error: "Forbidden" }, 403);
  const limit = await rateLimit(`subscribe:${getClientIp(req.headers)}`, 5, 600);
  if (!limit.allowed) return json({ ok: false, error: "Too many requests. Try again later." }, 429);

  const payload = await req.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(payload);
  if (!parsed.success) {
    if (payload && typeof payload === "object" && (payload as { website?: string }).website) return json({ ok: true });
    return json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email." }, 422);
  }

  const { email } = parsed.data;
  const [existing] = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  if (existing?.status === "subscribed") return json({ ok: true, already: true });

  const token = existing?.token ?? generateToken();
  try {
    if (existing) await db.update(subscribers).set({ status: "subscribed" }).where(eq(subscribers.id, existing.id));
    else await db.insert(subscribers).values({ email, token });
  } catch {
    return json({ ok: false, error: "Could not subscribe right now." }, 500);
  }

  after(async () => {
    const settings = await getSettings();
    await sendMail({ kind: "welcome", to: email, ...welcomeMail(settings, token) });
  });
  return json({ ok: true });
}
