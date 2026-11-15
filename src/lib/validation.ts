import { z } from "zod";
import { BOOKING_STATUSES } from "@/db/schema";
import { isSafeUrl } from "@/lib/utils";

export const SHOOT_TYPES = ["Videography", "Photography", "Photo + Video"] as const;

const optionalText = (max: number) => z.string().trim().max(max).default("");

export const bookingSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email: z
      .string()
      .trim()
      .max(255)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address.")
      .default(""),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine((v) => v === "" || /^[+()\d\s-]{7,20}$/.test(v), "Enter a valid phone number.")
      .default(""),
    shootType: z.enum(SHOOT_TYPES, { message: "Choose a shoot type." }),
    preferredDate: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date.")
      .default(""),
    location: optionalText(200),
    message: optionalText(2000),
    /** honeypot – real users never fill this */
    website: z.string().max(0).default(""),
  })
  .refine((d) => d.email !== "" || d.phone !== "", {
    message: "Please add a phone number or an email so we can reach you.",
    path: ["phone"],
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(200),
});

export const setupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(10).max(200),
  token: z.string().max(200).default(""),
});

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(255),
  website: z.string().max(0).default(""),
});

export const replySchema = z.object({
  id: z.string().uuid(),
  subject: z.string().trim().min(2, "Add a subject.").max(200),
  body: z.string().trim().min(2, "Write a message.").max(5000),
});

export const bookingUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(BOOKING_STATUSES),
  notes: z.string().trim().max(4000).default(""),
});

/* ───── Site settings ───── */

const s = (max = 300) => z.string().trim().max(max).default("");
const url = z
  .string()
  .trim()
  .max(2048)
  .refine(isSafeUrl, "Must be an http(s) URL")
  .default("");

export const settingsSchema = z.object({
  studioName: s(80),
  tagline: s(160),
  heroHeadline: s(160),
  heroSub: s(400),
  heroVideoUrl: url,
  heroPosterUrl: url,
  bioQuote: s(300),
  depositRule: s(300),
  phonePrimary: s(30),
  phoneSecondary: s(30),
  whatsapp: s(20),
  email: s(255),
  location: s(160),
  instagram: url,
  facebook: url,
  youtube: url,
  tiktok: url,
  notifyEmail: s(255),
  ogImageUrl: url,
  announcement: s(200),
  seoDescription: s(300),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

/* ───── CMS resource schema builder ───── */

export type FieldType = "text" | "textarea" | "number" | "checkbox" | "select" | "media" | "gallery";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  nullable?: boolean;
  max?: number;
  help?: string;
  options?: string[]; // static select
  optionsFrom?: string; // dynamic select (provided by the page)
  wide?: boolean;
  /** media fields: which library items to offer */
  accept?: "image" | "video" | "any";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildResourceSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    switch (f.type) {
      case "checkbox":
        shape[f.name] = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
        break;
      case "number": {
        const base = z.number().int().min(-1_000_000).max(1_000_000);
        shape[f.name] = z.preprocess(
          (v) => (v === "" || v == null ? (f.nullable ? null : 0) : Number(v)),
          f.nullable ? base.nullable() : base,
        );
        break;
      }
      case "media":
        shape[f.name] = z.string().trim().max(2048).refine(isSafeUrl, "Must be an http(s) URL or /path");
        break;
      case "gallery":
        shape[f.name] = z.preprocess(
          (v) => {
            if (Array.isArray(v)) return v;
            try {
              const parsed = JSON.parse(String(v || "[]"));
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          },
          z.array(z.string().trim().max(2048).refine((u) => u !== "" && isSafeUrl(u), "Invalid media URL")).max(30),
        );
        break;
      case "select":
        shape[f.name] = f.options
          ? z.enum(f.options as [string, ...string[]])
          : z.string().regex(UUID, "Pick an option");
        break;
      default: {
        const base = z.string().trim().max(f.max ?? (f.type === "textarea" ? 4000 : 300));
        shape[f.name] = f.required ? base.min(1, `${f.label} is required`) : base;
      }
    }
  }
  return z.object(shape);
}
