import { after } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getSettings } from "@/lib/content";
import { sendMail } from "@/lib/mail/mailgun";
import { bookingConfirmationMail, bookingNotificationMail } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/security";
import { buildWhatsAppLink } from "@/lib/utils";
import { bookingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return json({ ok: false, error: "Forbidden" }, 403);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 20_000) return json({ ok: false, error: "Payload too large" }, 413);

  const ip = getClientIp(req.headers);
  const limit = await rateLimit(`booking:${ip}`, 5, 600);
  if (!limit.allowed) {
    return json({ ok: false, error: "Too many requests. Please try again shortly." }, 429, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    // honeypot tripped → pretend success so bots learn nothing
    if (typeof payload === "object" && payload && "website" in payload && (payload as { website?: string }).website) {
      return json({ ok: true });
    }
    const issue = parsed.error.issues[0];
    return json({ ok: false, error: issue?.message ?? "Invalid input", field: String(issue?.path[0] ?? "") }, 422);
  }

  const { website: _website, ...data } = parsed.data;
  void _website;

  let bookingId: string;
  try {
    const [row] = await db.insert(bookings).values({ ...data, ip }).returning({ id: bookings.id });
    bookingId = row.id;
  } catch {
    return json({ ok: false, error: "Could not save your request. Please call us or use WhatsApp." }, 500);
  }

  const settings = await getSettings();

  // E-mails go out after the response is sent so the visitor never waits on Mailgun.
  after(async () => {
    const mailData = { id: bookingId, ...data };
    const notifyTo = settings.notifyEmail || settings.email || process.env.MAIL_TO || "";
    if (notifyTo) {
      const m = bookingNotificationMail(settings, mailData);
      await sendMail({ kind: "booking_notification", to: notifyTo, replyTo: data.email || undefined, bookingId, ...m });
    }
    if (data.email) {
      const m = bookingConfirmationMail(settings, mailData);
      await sendMail({ kind: "booking_confirmation", to: data.email, replyTo: notifyTo || undefined, bookingId, ...m });
    }
  });

  const whatsappUrl = settings.whatsapp ? buildWhatsAppLink(settings.whatsapp, data) : null;
  return json({ ok: true, whatsappUrl }, 201);
}
