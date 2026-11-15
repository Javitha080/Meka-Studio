import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ───────────── Auth (Supabase Auth owns credentials; this table is the CMS allow-list) ───────────── */

export const ADMIN_ROLES = ["owner", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** `id` equals the Supabase `auth.users.id`. Only users listed here can enter /admin. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull().default(""),
  role: varchar("role", { length: 20 }).$type<AdminRole>().notNull().default("editor"),
  createdAt: createdAt(),
});

export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 200 }).primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

/* ───────────── Content (CMS) ───────────── */

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: updatedAt(),
});

export const projects = pgTable(
  "projects",
  {
    id: id(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    category: varchar("category", { length: 60 }).notNull().default("Wedding"),
    client: varchar("client", { length: 160 }).notNull().default(""),
    year: integer("year"),
    description: text("description").notNull().default(""),
    /** Short muted loop used for hover / in-view previews (keep < 4 MB). */
    previewVideoUrl: text("preview_video_url").notNull().default(""),
    posterUrl: text("poster_url").notNull().default(""),
    /** Full film: YouTube / Vimeo link or direct MP4. */
    fullVideoUrl: text("full_video_url").notNull().default(""),
    /** Extra photos / clips shown in the project's bento gallery. */
    gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_pub_sort_idx").on(t.published, t.sortOrder)],
);

export const services = pgTable("services", {
  id: id(),
  number: varchar("number", { length: 8 }).notNull().default("01"),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const packageGroups = pgTable("package_groups", {
  id: id(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const packages = pgTable("packages", {
  id: id(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => packageGroups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  price: varchar("price", { length: 80 }).notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const testimonials = pgTable("testimonials", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 160 }).notNull().default(""),
  quote: text("quote").notNull(),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const mediaAssets = pgTable("media_assets", {
  id: id(),
  url: text("url").notNull(),
  path: text("path").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  kind: varchar("kind", { length: 10 }).notNull().default("image"),
  size: integer("size").notNull().default(0),
  createdAt: createdAt(),
});

export const faqs = pgTable("faqs", {
  id: id(),
  question: varchar("question", { length: 300 }).notNull(),
  answer: text("answer").notNull().default(""),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ───────────── Mail ───────────── */

export const subscribers = pgTable("subscribers", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("subscribed"),
  source: varchar("source", { length: 40 }).notNull().default("footer"),
  createdAt: createdAt(),
});

export const emailLogs = pgTable(
  "email_logs",
  {
    id: id(),
    kind: varchar("kind", { length: 40 }).notNull(),
    toEmail: varchar("to_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 300 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("queued"),
    providerId: varchar("provider_id", { length: 200 }),
    error: text("error"),
    bookingId: uuid("booking_id"),
    createdAt: createdAt(),
  },
  (t) => [index("email_logs_created_idx").on(t.createdAt), index("email_logs_provider_idx").on(t.providerId)],
);

/* ───────────── Bookings ───────────── */

export const BOOKING_STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().default(""),
    phone: varchar("phone", { length: 40 }).notNull().default(""),
    shootType: varchar("shoot_type", { length: 40 }).notNull(),
    preferredDate: varchar("preferred_date", { length: 10 }).notNull().default(""),
    location: varchar("location", { length: 200 }).notNull().default(""),
    message: text("message").notNull().default(""),
    status: varchar("status", { length: 20 }).$type<BookingStatus>().notNull().default("new"),
    notes: text("notes").notNull().default(""),
    ip: varchar("ip", { length: 64 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("bookings_status_idx").on(t.status, t.createdAt)],
);
