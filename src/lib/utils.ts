export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Only allow http(s) URLs or site-relative paths — blocks javascript:/data: injection. */
export function isSafeUrl(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export type VideoSource =
  | { type: "youtube"; src: string }
  | { type: "vimeo"; src: string }
  | { type: "file"; src: string }
  | { type: "none"; src: "" };

/** Turns a pasted link into something we can safely embed. */
export function parseVideoUrl(url: string): VideoSource {
  if (!url || !isSafeUrl(url)) return { type: "none", src: "" };
  try {
    const u = new URL(url, "https://placeholder.local");
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (/^[\w-]{6,20}$/.test(id))
        return { type: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1` };
    }
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:embed|shorts)\/([\w-]{6,20})/)?.[1];
      if (id && /^[\w-]{6,20}$/.test(id))
        return { type: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1` };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.match(/(\d{5,})/)?.[1];
      if (id) return { type: "vimeo", src: `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0` };
    }
    return { type: "file", src: url };
  } catch {
    return { type: "none", src: "" };
  }
}

export function buildWhatsAppLink(
  number: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    shootType: string;
    preferredDate?: string;
    location?: string;
    message?: string;
  },
): string {
  const digits = number.replace(/\D/g, "");
  const body = [
    "New booking request",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email ?? ""}`,
    `Phone: ${data.phone ?? ""}`,
    `Shoot type: ${data.shootType}`,
    `Date: ${data.preferredDate ?? ""}`,
    `Location: ${data.location ?? ""}`,
    "",
    "Details:",
    data.message ?? "",
  ].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
