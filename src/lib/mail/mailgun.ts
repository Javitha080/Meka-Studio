import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";

export interface MailInput {
  kind: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  bookingId?: string;
  tags?: string[];
}

export interface MailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  id?: string;
}

export const isMailConfigured = () => Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);

const apiBase = () =>
  (process.env.MAILGUN_REGION ?? "us").toLowerCase() === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";

export function fromAddress(studioName = "Meka Studio") {
  return process.env.MAIL_FROM || `${studioName} <postmaster@${process.env.MAILGUN_DOMAIN ?? "localhost"}>`;
}

/** Strip CR/LF so user input can never inject extra headers. */
const clean = (v: string) => v.replace(/[\r\n]+/g, " ").trim();

/**
 * Sends a transactional e-mail through the Mailgun HTTP API and records it in `email_logs`.
 * Never throws — a mail outage must not break booking submissions.
 */
export async function sendMail(input: MailInput): Promise<MailResult> {
  const subject = clean(input.subject).slice(0, 300);
  const to = clean(input.to);

  const [log] = await db
    .insert(emailLogs)
    .values({
      kind: input.kind,
      toEmail: to,
      subject,
      status: isMailConfigured() ? "queued" : "skipped",
      bookingId: input.bookingId,
      error: isMailConfigured() ? null : "Mailgun is not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN).",
    })
    .returning({ id: emailLogs.id })
    .catch(() => []);

  if (!isMailConfigured()) return { ok: false, skipped: true, error: "Mailgun is not configured." };

  try {
    const body = new URLSearchParams();
    body.set("from", clean(fromAddress()));
    body.set("to", to);
    body.set("subject", subject);
    body.set("text", input.text);
    body.set("html", input.html);
    if (input.replyTo) body.set("h:Reply-To", clean(input.replyTo));
    for (const tag of input.tags ?? [input.kind]) body.append("o:tag", tag);

    const res = await fetch(`${apiBase()}/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(12_000),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      const error = `Mailgun ${res.status}: ${json.message ?? "request failed"}`;
      if (log) await db.update(emailLogs).set({ status: "failed", error }).where(eq(emailLogs.id, log.id)).catch(() => {});
      return { ok: false, error };
    }
    const providerId = (json.id ?? "").replace(/^<|>$/g, "");
    if (log) await db.update(emailLogs).set({ status: "sent", providerId }).where(eq(emailLogs.id, log.id)).catch(() => {});
    return { ok: true, id: providerId };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown mail error";
    if (log) await db.update(emailLogs).set({ status: "failed", error }).where(eq(emailLogs.id, log.id)).catch(() => {});
    return { ok: false, error };
  }
}
