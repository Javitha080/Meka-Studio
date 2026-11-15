import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, isSafeUrl, parseVideoUrl, slugify, telHref } from "@/lib/utils";

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Wedding Highlights!")).toBe("wedding-highlights");
    expect(slugify("  Café — Ünïcode  ")).toBe("cafe-unicode");
    expect(slugify("***")).toBe("");
  });
});

describe("isSafeUrl", () => {
  it("allows http(s) and site paths only", () => {
    expect(isSafeUrl("")).toBe(true);
    expect(isSafeUrl("https://a.com/x.mp4")).toBe(true);
    expect(isSafeUrl("/brand/logo.png")).toBe(true);
    expect(isSafeUrl("//evil.com/x")).toBe(false);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,hi")).toBe(false);
  });
});

describe("parseVideoUrl", () => {
  it("converts YouTube links to privacy-friendly embeds", () => {
    const a = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    const b = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(a.type).toBe("youtube");
    expect(a.src).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(b.src).toBe(a.src);
  });
  it("handles Vimeo, files and junk", () => {
    expect(parseVideoUrl("https://vimeo.com/123456789").src).toContain("player.vimeo.com/video/123456789");
    expect(parseVideoUrl("https://cdn.x.com/film.mp4")).toEqual({ type: "file", src: "https://cdn.x.com/film.mp4" });
    expect(parseVideoUrl("javascript:alert(1)").type).toBe("none");
    expect(parseVideoUrl("").type).toBe("none");
  });
});

describe("buildWhatsAppLink", () => {
  it("strips non-digits and url-encodes the message", () => {
    const url = buildWhatsAppLink("+94 75-298 4125", { name: "Nimal", shootType: "Videography", message: "Hi & bye" });
    expect(url.startsWith("https://wa.me/94752984125?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("Name: Nimal");
    expect(url).toContain(encodeURIComponent("Hi & bye"));
  });
});

describe("telHref", () => {
  it("normalises phone numbers", () => {
    expect(telHref("070 411 5474")).toBe("tel:0704115474");
    expect(telHref("+94 70 411 5474")).toBe("tel:+94704115474");
  });
});
