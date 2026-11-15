import { randomBytes, createHash, scrypt as _scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const KEYLEN = 64;

function scrypt(password: string, salt: Buffer, keylen: number, N: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    _scrypt(password, salt, keylen, { N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** scrypt$N$salt$hash (base64url) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, SCRYPT_N);
  return `scrypt$${SCRYPT_N}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !n || !salt || !hash) return false;
  try {
    const expected = Buffer.from(hash, "base64url");
    const actual = await scrypt(password, Buffer.from(salt, "base64url"), expected.length, Number(n));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Constant-time string comparison (for setup tokens etc.). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getClientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim().slice(0, 64);
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim().slice(0, 64);
  return headers.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

/**
 * CSRF defence for cookie-authenticated / public mutation endpoints:
 * the Origin header must match the Host we are serving.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin) return headers.get("sec-fetch-site") === "same-origin";
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function passwordIssues(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    return "Use upper-case, lower-case letters and a number.";
  return null;
}
