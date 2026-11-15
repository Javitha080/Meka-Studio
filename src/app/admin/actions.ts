"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  ADMIN_ROLES,
  bookings,
  emailLogs,
  faqs,
  mediaAssets,
  packageGroups,
  packages,
  profiles,
  projects,
  services,
  siteSettings,
  subscribers,
  testimonials,
} from "@/db/schema";
import { isBootstrapAdmin, requireAdmin, requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/content";
import { sendMail } from "@/lib/mail/mailgun";
import { bookingStatusMail, replyMail, siteUrl, testMail, type BookingMailData } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/rate-limit";
import { RESOURCES, type ResourceKey } from "@/lib/resources";
import { seedDefaults } from "@/lib/seed";
import { getClientIp, passwordIssues, safeEqual } from "@/lib/security";
import { isStorageConfigured, isSupabaseConfigured, storageBucket } from "@/lib/supabase/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  bookingUpdateSchema,
  buildResourceSchema,
  loginSchema,
  replySchema,
  settingsSchema,
  setupSchema,
} from "@/lib/validation";

export interface FormState {
  ok?: boolean;
  error?: string;
  message?: string;
}

const TABLES = {
  projects,
  services,
  package_groups: packageGroups,
  packages,
  testimonials,
  faqs,
} as const;

const firstIssue = (e: { issues: Array<{ message: string; path: PropertyKey[] }> }) =>
  e.issues[0] ? `${String(e.issues[0].path[0] ?? "")}: ${e.issues[0].message}`.replace(/^: /, "") : "Invalid input";

/** Refresh every public page + admin after a CMS change. */
function refresh() {
  revalidatePath("/", "layout");
}

const NOT_CONFIGURED = "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

/* ───────────── auth (Supabase) ───────────── */

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  const ip = getClientIp(await headers());
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid e-mail and password." };

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 10, 900),
    rateLimit(`login:email:${parsed.data.email}`, 6, 900),
  ]);
  if (!byIp.allowed || !byEmail.allowed) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "Incorrect e-mail or password." };

  // The CMS is invite-only: the Supabase user must be on the allow-list.
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1);
  if (!profile) {
    if (isBootstrapAdmin(parsed.data.email)) {
      await db
        .insert(profiles)
        .values({ id: data.user.id, email: parsed.data.email, name: parsed.data.email.split("@")[0], role: "owner" })
        .onConflictDoNothing();
    } else {
      await supabase.auth.signOut();
      return { error: "This account does not have access to the CMS." };
    }
  }
  redirect("/admin");
}

export async function setupAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured() || !isStorageConfigured()) {
    return { error: "Set SUPABASE_SERVICE_ROLE_KEY (server-only) to create the owner account." };
  }
  const ip = getClientIp(await headers());
  const limit = await rateLimit(`setup:ip:${ip}`, 5, 900);
  if (!limit.allowed) return { error: "Too many attempts. Try again later." };

  const [{ n }] = await db.select({ n: count() }).from(profiles);
  if (n > 0) return { error: "Setup is already complete. Please sign in." };

  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const required = process.env.SETUP_TOKEN;
  if (!required && !isBootstrapAdmin(parsed.data.email)) {
    return { error: "Set SETUP_TOKEN (or list this e-mail in ADMIN_EMAILS) on the server to enable first-run setup." };
  }
  if (required && !safeEqual(parsed.data.token, required)) return { error: "Invalid setup token." };

  const weak = passwordIssues(parsed.data.password);
  if (weak) return { error: weak };

  const admin = createSupabaseAdminClient();
  const created = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });
  const userId = created.data.user?.id;
  if (created.error || !userId) {
    return {
      error: /already|registered/i.test(created.error?.message ?? "")
        ? "That e-mail already has a Supabase account — sign in instead (it is promoted automatically when listed in ADMIN_EMAILS)."
        : "Could not create the account.",
    };
  }

  await db.insert(profiles).values({ id: userId, email: parsed.data.email, name: parsed.data.name, role: "owner" });
  await seedDefaults();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  refresh();
  redirect(error ? "/admin/login" : "/admin");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  const ip = getClientIp(await headers());
  const limit = await rateLimit(`reset:ip:${ip}`, 5, 900);
  if (!limit.allowed) return { error: "Too many requests. Try again later." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid e-mail." };
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/admin/reset-password`,
  });
  // Always the same answer so the form can't be used to discover accounts.
  return { ok: true, message: "If that account exists, a reset link is on its way." };
}

export async function updatePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { error: "Passwords do not match." };
  const weak = passwordIssues(password);
  if (weak) return { error: weak };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Your reset link has expired. Request a new one." };
  redirect("/admin");
}

/* ───────────── team (owner only) ───────────── */

export async function addTeamMemberAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const role = String(formData.get("role") ?? "editor") as (typeof ADMIN_ROLES)[number];
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid e-mail." };
  if (!ADMIN_ROLES.includes(role)) return { error: "Invalid role." };
  if (!isStorageConfigured()) return { error: "SUPABASE_SERVICE_ROLE_KEY is required to add team members." };

  const admin = createSupabaseAdminClient();
  const tempPassword = `${crypto.randomUUID()}Aa1!`;
  const created = await admin.auth.admin.createUser({ email, password: tempPassword, email_confirm: true, user_metadata: { name } });
  let id = created.data.user?.id;
  if (!id) {
    // the user may already exist in Supabase Auth → look them up
    const list = await admin.auth.admin.listUsers({ perPage: 200 });
    id = list.data.users.find((u) => u.email?.toLowerCase() === email)?.id;
  }
  if (!id) return { error: created.error?.message ?? "Could not create the user." };

  const display = name || email.split("@")[0];
  await db
    .insert(profiles)
    .values({ id, email, name: display, role })
    .onConflictDoUpdate({ target: profiles.id, set: { role, name: display } });

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/admin/reset-password` });
  revalidatePath("/admin/team");
  return { ok: true, message: `${email} added. A password-setup e-mail was sent.` };
}

export async function removeTeamMemberAction(formData: FormData) {
  const me = await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id || id === me.userId) return;
  await db.delete(profiles).where(eq(profiles.id, id));
  revalidatePath("/admin/team");
}

/* ───────────── generic CMS resources ───────────── */

export async function saveResourceAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const key = String(formData.get("_resource")) as ResourceKey;
  const id = String(formData.get("_id") ?? "");
  const def = RESOURCES[key];
  if (!def) return { error: "Unknown resource." };

  const parsed = buildResourceSchema(def.fields).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const data = parsed.data as Record<string, unknown>;
  if (def.hasSlug) {
    data.slug = slugify(String(data.slug || data.title)) || `item-${Date.now()}`;
  }

  const table = TABLES[key] as typeof projects;
  try {
    if (id) {
      await db.update(table).set(data as Partial<typeof projects.$inferInsert>).where(eq(table.id, id));
    } else {
      await db.insert(table).values(data as typeof projects.$inferInsert);
    }
  } catch (e) {
    const code = (e as { code?: string; cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code;
    if (code === "23505") return { error: "That URL slug is already used. Choose another." };
    return { error: "Could not save. Please try again." };
  }
  refresh();
  return { ok: true, message: id ? "Saved." : "Created." };
}

export async function deleteResourceAction(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("_resource")) as ResourceKey;
  const id = String(formData.get("_id") ?? "");
  if (!RESOURCES[key] || !id) return;
  const table = TABLES[key] as typeof projects;
  await db.delete(table).where(eq(table.id, id));
  refresh();
}

/** Flip published / featured flags straight from the list. */
export async function toggleFlagAction(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("_resource")) as ResourceKey;
  const id = String(formData.get("_id") ?? "");
  const flag = String(formData.get("flag"));
  const value = String(formData.get("value")) === "true";
  if (!RESOURCES[key] || !id || (flag !== "published" && flag !== "featured")) return;
  const table = TABLES[key] as typeof projects;
  if (!(flag in table)) return;
  await db.update(table).set({ [flag]: value } as Partial<typeof projects.$inferInsert>).where(eq(table.id, id));
  refresh();
}

/* ───────────── bookings ───────────── */

async function loadBooking(id: string): Promise<(BookingMailData & { status: string }) | null> {
  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return b ?? null;
}

export async function updateBookingAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = bookingUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input." };
  const before = await loadBooking(parsed.data.id);
  if (!before) return { error: "Booking not found." };

  await db.update(bookings).set({ status: parsed.data.status, notes: parsed.data.notes }).where(eq(bookings.id, parsed.data.id));

  let message = "Updated.";
  const notify = formData.get("notify") === "on";
  if (notify && before.status !== parsed.data.status && before.email && parsed.data.status !== "new") {
    const settings = await getSettings();
    const m = bookingStatusMail(settings, before, parsed.data.status);
    const res = await sendMail({
      kind: "booking_status",
      to: before.email,
      replyTo: settings.notifyEmail || settings.email || undefined,
      bookingId: before.id,
      ...m,
    });
    message = res.ok ? "Updated — client notified by e-mail." : `Updated, but e-mail failed: ${res.error}`;
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message };
}

export async function replyBookingAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const booking = await loadBooking(parsed.data.id);
  if (!booking?.email) return { error: "This client did not leave an e-mail address." };

  const settings = await getSettings();
  const m = replyMail(settings, booking, parsed.data.subject, parsed.data.body);
  const res = await sendMail({
    kind: "booking_reply",
    to: booking.email,
    replyTo: settings.notifyEmail || settings.email || undefined,
    bookingId: booking.id,
    ...m,
  });
  if (!res.ok) return { error: res.skipped ? "Mailgun is not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN)." : (res.error ?? "Send failed.") };
  if (booking.status === "new") await db.update(bookings).set({ status: "contacted" }).where(eq(bookings.id, booking.id));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Reply sent." };
}

export async function deleteBookingAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await db.delete(bookings).where(eq(bookings.id, id));
  revalidatePath("/admin", "layout");
}

/* ───────────── media ───────────── */

export async function deleteMediaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!row) return;
  if (isStorageConfigured()) {
    await createSupabaseAdminClient().storage.from(storageBucket()).remove([row.path]).catch(() => {});
  }
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  revalidatePath("/admin/media");
}

/* ───────────── subscribers ───────────── */

export async function deleteSubscriberAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await db.delete(subscribers).where(eq(subscribers.id, id));
  revalidatePath("/admin/subscribers");
}

/* ───────────── mail ───────────── */

export async function sendTestMailAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const to = String(formData.get("to") || session.email).trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) return { error: "Enter a valid e-mail." };
  const settings = await getSettings();
  const res = await sendMail({ kind: "test", to, ...testMail(settings) });
  revalidatePath("/admin/emails");
  return res.ok ? { ok: true, message: `Test e-mail sent to ${to}.` } : { error: res.error ?? "Send failed." };
}

export async function clearEmailLogAction() {
  await requireOwner();
  await db.delete(emailLogs);
  revalidatePath("/admin/emails");
}

/* ───────────── settings & seed ───────────── */

export async function saveSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await db
    .insert(siteSettings)
    .values({ key: "general", value: parsed.data })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: parsed.data, updatedAt: new Date() } });
  refresh();
  return { ok: true, message: "Settings saved." };
}

export async function seedAction(): Promise<void> {
  await requireAdmin();
  await seedDefaults();
  refresh();
}
