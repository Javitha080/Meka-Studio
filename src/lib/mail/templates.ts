import type { SiteSettings } from "@/lib/validation";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");

interface Shell {
  studio: string;
  preheader: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  footer?: string;
}

function shell({ studio, preheader, title, body, cta, footer }: Shell): string {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;background:#050506;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#e8e9ec;">
<span style="display:none;opacity:0;height:0;overflow:hidden;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050506;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#0b0b0d;border:1px solid #1f1f23;border-radius:20px;overflow:hidden;">
<tr><td style="padding:28px 32px 0;"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;font-weight:800;color:#c9ccd1;">${esc(studio)} <span style="color:#2dff8a;">●</span></div></td></tr>
<tr><td style="padding:20px 32px 8px;"><h1 style="margin:0;font-size:28px;line-height:1.15;color:#fff;letter-spacing:-.02em;">${esc(title)}</h1></td></tr>
<tr><td style="padding:8px 32px 8px;font-size:15px;line-height:1.65;color:#b8bbc2;">${body}</td></tr>
${
  cta
    ? `<tr><td style="padding:16px 32px 8px;"><a href="${esc(cta.href)}" style="display:inline-block;background:#2dff8a;color:#000;font-weight:800;font-size:12px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;padding:14px 26px;border-radius:999px;">${esc(cta.label)}</a></td></tr>`
    : ""
}
<tr><td style="padding:28px 32px 32px;font-size:12px;line-height:1.6;color:#6e7178;border-top:1px solid #1a1a1e;margin-top:20px;">${footer ?? `${esc(studio)} · <a href="${siteUrl()}" style="color:#8a8d94;">${siteUrl().replace(/^https?:\/\//, "")}</a>`}</td></tr>
</table></td></tr></table></body></html>`;
}

const rows = (pairs: Array<[string, string]>) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:14px 0;border:1px solid #202025;border-radius:12px;">${pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 14px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6e7178;width:130px;border-bottom:1px solid #17171a;">${esc(k)}</td><td style="padding:10px 14px;color:#e8e9ec;border-bottom:1px solid #17171a;">${nl2br(v)}</td></tr>`,
    )
    .join("")}</table>`;

export interface BookingMailData {
  id: string;
  name: string;
  email: string;
  phone: string;
  shootType: string;
  preferredDate: string;
  location: string;
  message: string;
}

export function bookingNotificationMail(s: SiteSettings, b: BookingMailData) {
  const subject = `New booking — ${b.name} · ${b.shootType}${b.preferredDate ? ` · ${b.preferredDate}` : ""}`;
  const pairs: Array<[string, string]> = [
    ["Name", b.name],
    ["Email", b.email],
    ["Phone", b.phone],
    ["Shoot", b.shootType],
    ["Date", b.preferredDate],
    ["Location", b.location],
    ["Details", b.message],
  ];
  return {
    subject,
    html: shell({
      studio: s.studioName,
      preheader: `${b.name} requested a ${b.shootType} shoot.`,
      title: "New booking request",
      body: `<p style="margin:0 0 8px;">A client just submitted the booking form.</p>${rows(pairs)}<p style="margin:0;color:#8a8d94;font-size:13px;">Hit reply to answer ${esc(b.name)} directly.</p>`,
      cta: { label: "Open in CMS", href: `${siteUrl()}/admin/bookings` },
    }),
    text: `New booking request\n\n${pairs.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nOpen: ${siteUrl()}/admin/bookings`,
  };
}

export function bookingConfirmationMail(s: SiteSettings, b: BookingMailData) {
  const contact = [s.phonePrimary, s.phoneSecondary].filter(Boolean).join(" · ");
  return {
    subject: `We got your request — ${s.studioName}`,
    html: shell({
      studio: s.studioName,
      preheader: "Your booking request has been received.",
      title: `Thanks ${b.name.split(" ")[0]}, we're on it.`,
      body: `<p style="margin:0 0 8px;">Your request has been received and we usually reply the same day. Here is what you sent:</p>${rows([
        ["Shoot", b.shootType],
        ["Date", b.preferredDate],
        ["Location", b.location],
        ["Details", b.message],
      ])}<p style="margin:0 0 8px;">${esc(s.depositRule)}</p>${contact ? `<p style="margin:0;">Need us sooner? Call <strong style="color:#fff;">${esc(contact)}</strong>.</p>` : ""}`,
      cta: { label: "Visit the studio", href: siteUrl() },
    }),
    text: `Thanks ${b.name}, your booking request was received. We usually reply the same day.\n\n${s.depositRule}\n${contact ? `Call: ${contact}\n` : ""}`,
  };
}

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  contacted: { title: "We've reviewed your request", body: "We have looked at your details and will be in touch shortly with availability and a tailored quote." },
  confirmed: { title: "Your date is confirmed 🎬", body: "Great news — your shoot is confirmed. Please complete the deposit to lock in your date, and we'll send the shoot plan shortly." },
  completed: { title: "Thank you!", body: "It was a pleasure working with you. Your final delivery will reach you soon — we'd love to hear what you think." },
  cancelled: { title: "Your booking was cancelled", body: "Your booking has been cancelled. If this is a mistake or you'd like to rebook, just reply to this e-mail." },
};

export function bookingStatusMail(s: SiteSettings, b: BookingMailData, status: string) {
  const copy = STATUS_COPY[status] ?? { title: "Booking update", body: `Your booking status is now "${status}".` };
  return {
    subject: `${copy.title.replace(/[^\p{L}\p{N}\s',.!-]/gu, "").trim()} — ${s.studioName}`,
    html: shell({
      studio: s.studioName,
      preheader: copy.body,
      title: copy.title,
      body: `<p style="margin:0 0 8px;">Hi ${esc(b.name)},</p><p style="margin:0 0 8px;">${esc(copy.body)}</p>${rows([
        ["Shoot", b.shootType],
        ["Date", b.preferredDate],
        ["Location", b.location],
      ])}`,
    }),
    text: `Hi ${b.name},\n\n${copy.body}\n\n— ${s.studioName}`,
  };
}

export function replyMail(s: SiteSettings, b: BookingMailData, subject: string, body: string) {
  return {
    subject,
    html: shell({
      studio: s.studioName,
      preheader: body.slice(0, 90),
      title: subject,
      body: `<p style="margin:0 0 8px;">Hi ${esc(b.name)},</p><p style="margin:0;">${nl2br(body)}</p>`,
    }),
    text: `Hi ${b.name},\n\n${body}\n\n— ${s.studioName}`,
  };
}

export function welcomeMail(s: SiteSettings, token: string) {
  const unsub = `${siteUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
  return {
    subject: `Welcome to ${s.studioName}`,
    html: shell({
      studio: s.studioName,
      preheader: "You're on the list.",
      title: "You're on the list.",
      body: `<p style="margin:0;">Thanks for subscribing. Expect new films, behind-the-scenes stories and the occasional booking offer — never spam.</p>`,
      cta: { label: "See the latest work", href: `${siteUrl()}/work` },
      footer: `You received this because you subscribed on ${siteUrl().replace(/^https?:\/\//, "")}. <a href="${unsub}" style="color:#8a8d94;">Unsubscribe</a>`,
    }),
    text: `You're on the list. Unsubscribe: ${unsub}`,
  };
}

export function testMail(s: SiteSettings) {
  return {
    subject: `Test e-mail from ${s.studioName}`,
    html: shell({
      studio: s.studioName,
      preheader: "Mailgun is wired up correctly.",
      title: "Mailgun works ✅",
      body: `<p style="margin:0;">If you can read this, your Mailgun domain, API key and sender address are configured correctly.</p>`,
    }),
    text: "Mailgun works. Your domain, API key and sender address are configured correctly.",
  };
}
