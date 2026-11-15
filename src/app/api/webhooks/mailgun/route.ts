import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Mailgun event webhook → updates delivery status in the CMS e-mail log. */
export async function POST(req: Request) {
  const key = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!key) return Response.json({ ok: false, error: "Webhook not configured" }, { status: 501 });

  const body = (await req.json().catch(() => null)) as {
    signature?: { timestamp: string; token: string; signature: string };
    "event-data"?: { event?: string; severity?: string; message?: { headers?: { "message-id"?: string } }; "delivery-status"?: { message?: string } };
  } | null;
  const sig = body?.signature;
  if (!body || !sig) return Response.json({ ok: false }, { status: 400 });

  const expected = createHmac("sha256", key).update(sig.timestamp + sig.token).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sig.signature));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return Response.json({ ok: false }, { status: 401 });
  if (Math.abs(Date.now() / 1000 - Number(sig.timestamp)) > 600) return Response.json({ ok: false }, { status: 401 });

  const ev = body["event-data"];
  const messageId = ev?.message?.headers?.["message-id"];
  if (ev?.event && messageId) {
    const map: Record<string, string> = {
      delivered: "delivered",
      failed: ev.severity === "temporary" ? "sent" : "failed",
      opened: "opened",
      clicked: "clicked",
      complained: "complained",
      unsubscribed: "unsubscribed",
    };
    const status = map[ev.event];
    if (status) {
      await db
        .update(emailLogs)
        .set({ status, error: status === "failed" ? (ev["delivery-status"]?.message ?? "Delivery failed") : null })
        .where(eq(emailLogs.providerId, messageId))
        .catch(() => {});
    }
  }
  return Response.json({ ok: true });
}
