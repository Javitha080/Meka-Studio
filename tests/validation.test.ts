import { describe, expect, it } from "vitest";
import { bookingSchema, buildResourceSchema, loginSchema, settingsSchema } from "@/lib/validation";
import { RESOURCES } from "@/lib/resources";

const valid = { name: "Nimal Perera", phone: "0704115474", shootType: "Videography" };

describe("bookingSchema", () => {
  it("accepts a minimal valid booking and applies defaults", () => {
    const r = bookingSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("");
      expect(r.data.message).toBe("");
    }
  });

  it("requires a phone or an email", () => {
    expect(bookingSchema.safeParse({ name: "Nimal", shootType: "Photography" }).success).toBe(false);
    expect(bookingSchema.safeParse({ name: "Nimal", shootType: "Photography", email: "a@b.co" }).success).toBe(true);
  });

  it("rejects bad input", () => {
    expect(bookingSchema.safeParse({ ...valid, name: "N" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, shootType: "Drone" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, phone: "call me maybe" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, preferredDate: "tomorrow" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
  });

  it("fails when the honeypot is filled", () => {
    expect(bookingSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normalises the e-mail", () => {
    const r = loginSchema.parse({ email: "  Admin@Meka.Studio ", password: "x" });
    expect(r.email).toBe("admin@meka.studio");
  });
});

describe("settingsSchema", () => {
  it("blocks javascript: URLs", () => {
    expect(settingsSchema.safeParse({ instagram: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ instagram: "https://instagram.com/meka" }).success).toBe(true);
  });
});

describe("buildResourceSchema", () => {
  const schema = buildResourceSchema(RESOURCES.projects.fields);

  it("coerces checkboxes and numbers from FormData-like input", () => {
    const r = schema.parse({
      title: "Film",
      slug: "",
      category: "Wedding",
      client: "",
      year: "2025",
      description: "",
      previewVideoUrl: "",
      posterUrl: "",
      fullVideoUrl: "",
      sortOrder: "",
      featured: "on",
    }) as Record<string, unknown>;
    expect(r.year).toBe(2025);
    expect(r.sortOrder).toBe(0);
    expect(r.featured).toBe(true);
    expect(r.published).toBe(false);
  });

  it("requires titles and rejects unsafe media URLs and unknown categories", () => {
    const base = { title: "x", category: "Wedding", client: "", year: "", description: "", slug: "", sortOrder: "0" };
    expect(schema.safeParse({ ...base, title: "", previewVideoUrl: "", posterUrl: "", fullVideoUrl: "" }).success).toBe(false);
    expect(schema.safeParse({ ...base, previewVideoUrl: "javascript:alert(1)", posterUrl: "", fullVideoUrl: "" }).success).toBe(false);
    expect(schema.safeParse({ ...base, category: "Hacking", previewVideoUrl: "", posterUrl: "", fullVideoUrl: "" }).success).toBe(false);
  });

  it("drops unknown keys (mass-assignment protection)", () => {
    const r = schema.parse({
      title: "x", category: "Wedding", client: "", year: "", description: "", slug: "", sortOrder: "0",
      previewVideoUrl: "", posterUrl: "", fullVideoUrl: "", id: "evil", createdAt: "2000-01-01",
    }) as Record<string, unknown>;
    expect(r.id).toBeUndefined();
    expect(r.createdAt).toBeUndefined();
  });
});
