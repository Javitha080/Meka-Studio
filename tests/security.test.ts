import { describe, expect, it } from "vitest";
import {
  generateToken,
  getClientIp,
  hashPassword,
  hashToken,
  isSameOrigin,
  passwordIssues,
  safeEqual,
  verifyPassword,
} from "@/lib/security";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("Correct-Horse-9");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Correct-Horse-9", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-1A", hash)).toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    expect(await hashPassword("Same-Password-1")).not.toBe(await hashPassword("Same-Password-1"));
  });

  it("rejects malformed stored hashes without throwing", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3")).toBe(false);
    expect(await verifyPassword("x", "scrypt$abc$def$ghi")).toBe(false);
  });

  it("enforces password strength", () => {
    expect(passwordIssues("short1A")).toBeTruthy();
    expect(passwordIssues("alllowercase123")).toBeTruthy();
    expect(passwordIssues("GoodPassw0rd!")).toBeNull();
  });
});

describe("tokens", () => {
  it("generates long unique tokens and hashes them deterministically", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).not.toBe(a);
  });

  it("safeEqual compares strings of different lengths safely", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("request helpers", () => {
  it("accepts same-origin and rejects cross-origin requests", () => {
    expect(isSameOrigin(new Headers({ origin: "https://meka.studio", host: "meka.studio" }))).toBe(true);
    expect(isSameOrigin(new Headers({ origin: "https://evil.com", host: "meka.studio" }))).toBe(false);
    expect(isSameOrigin(new Headers({ origin: "not a url", host: "meka.studio" }))).toBe(false);
  });

  it("falls back to Sec-Fetch-Site when Origin is absent", () => {
    expect(isSameOrigin(new Headers({ host: "a.com", "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameOrigin(new Headers({ host: "a.com", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOrigin(new Headers({ host: "a.com" }))).toBe(false);
  });

  it("prefers Cloudflare's connecting IP", () => {
    expect(getClientIp(new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(getClientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
