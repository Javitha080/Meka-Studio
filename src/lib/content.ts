import { cache } from "react";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  faqs,
  packageGroups,
  packages,
  projects,
  services,
  siteSettings,
  testimonials,
} from "@/db/schema";
import {
  DEFAULT_FAQS,
  DEFAULT_PROJECTS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  type FaqView,
  type ProjectView,
  type ServiceView,
  type TestimonialView,
} from "@/lib/defaults";
import { settingsSchema, type SiteSettings } from "@/lib/validation";

/**
 * Public content loaders. Every loader falls back to the bundled starter
 * content if the database is empty or unreachable, so the marketing site
 * never goes down because of the CMS.
 */

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "general")).limit(1);
    if (!row) return DEFAULT_SETTINGS;
    const parsed = settingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...row.value });
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
});

const projectColumns = {
  id: projects.id,
  slug: projects.slug,
  title: projects.title,
  category: projects.category,
  client: projects.client,
  year: projects.year,
  description: projects.description,
  previewVideoUrl: projects.previewVideoUrl,
  posterUrl: projects.posterUrl,
  fullVideoUrl: projects.fullVideoUrl,
  gallery: projects.gallery,
  featured: projects.featured,
};

export async function getProjects(): Promise<ProjectView[]> {
  try {
    const rows = await db
      .select(projectColumns)
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
    return rows.length ? rows : DEFAULT_PROJECTS;
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export async function getProject(slug: string): Promise<ProjectView | null> {
  try {
    const [row] = await db
      .select(projectColumns)
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.published, true)))
      .limit(1);
    if (row) return row;
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_PROJECTS.find((p) => p.slug === slug) ?? null;
}

export async function getServices(): Promise<ServiceView[]> {
  try {
    const [svc, grp, pkg] = await Promise.all([
      db.select().from(services).where(eq(services.published, true)).orderBy(asc(services.sortOrder)),
      db.select().from(packageGroups).orderBy(asc(packageGroups.sortOrder)),
      db.select().from(packages).orderBy(asc(packages.sortOrder)),
    ]);
    if (!svc.length) return DEFAULT_SERVICES;
    return svc.map((s) => ({
      id: s.id,
      number: s.number,
      title: s.title,
      description: s.description,
      groups: grp
        .filter((x) => x.serviceId === s.id)
        .map((x) => ({
          id: x.id,
          title: x.title,
          packages: pkg
            .filter((p) => p.groupId === x.id)
            .map((p) => ({ id: p.id, name: p.name, description: p.description, price: p.price })),
        })),
    }));
  } catch {
    return DEFAULT_SERVICES;
  }
}

export async function getTestimonials(): Promise<TestimonialView[]> {
  try {
    return await db
      .select({
        id: testimonials.id,
        name: testimonials.name,
        role: testimonials.role,
        quote: testimonials.quote,
      })
      .from(testimonials)
      .where(eq(testimonials.published, true))
      .orderBy(asc(testimonials.sortOrder));
  } catch {
    return [];
  }
}

export async function getFaqs(): Promise<FaqView[]> {
  try {
    const rows = await db
      .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
      .from(faqs)
      .where(eq(faqs.published, true))
      .orderBy(asc(faqs.sortOrder));
    return rows.length ? rows : DEFAULT_FAQS;
  } catch {
    return DEFAULT_FAQS;
  }
}
