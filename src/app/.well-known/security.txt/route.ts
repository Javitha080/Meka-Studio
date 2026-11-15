import { getSettings } from "@/lib/content";

export const revalidate = 86400;

/** RFC 9116 security contact. */
export async function GET() {
  const s = await getSettings();
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const contact = s.email ? `mailto:${s.email}` : `${base}/#book`;
  const expires = new Date(Date.now() + 365 * 86_400_000).toISOString();
  return new Response(`Contact: ${contact}\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${base}/.well-known/security.txt\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
