import { count } from "drizzle-orm";
import { db } from "@/db";
import { faqs, packageGroups, packages, projects, services, siteSettings } from "@/db/schema";
import { DEFAULT_SETTINGS, SEED_FAQS, SEED_PROJECTS, SEED_SERVICE_DATA } from "@/lib/defaults";

/** Idempotent: only fills tables that are empty, never overwrites edits. */
export async function seedDefaults() {
  const result = { settings: false, projects: 0, services: 0 };

  await db
    .insert(siteSettings)
    .values({ key: "general", value: DEFAULT_SETTINGS as unknown as Record<string, unknown> })
    .onConflictDoNothing();
  result.settings = true;

  const [{ n: projectCount }] = await db.select({ n: count() }).from(projects);
  if (projectCount === 0) {
    await db.insert(projects).values(SEED_PROJECTS.map((p, i) => ({ ...p, published: true, sortOrder: i })));
    result.projects = SEED_PROJECTS.length;
  }

  const [{ n: faqCount }] = await db.select({ n: count() }).from(faqs);
  if (faqCount === 0) await db.insert(faqs).values(SEED_FAQS.map((f, i) => ({ ...f, sortOrder: i })));

  const [{ n: serviceCount }] = await db.select({ n: count() }).from(services);
  if (serviceCount === 0) {
    for (const [si, s] of SEED_SERVICE_DATA.entries()) {
      const [svc] = await db
        .insert(services)
        .values({ number: s.number, title: s.title, description: s.description, sortOrder: si })
        .returning({ id: services.id });
      for (const [gi, grp] of s.groups.entries()) {
        const [g] = await db
          .insert(packageGroups)
          .values({ serviceId: svc.id, title: grp.title, sortOrder: gi })
          .returning({ id: packageGroups.id });
        await db.insert(packages).values(
          grp.rows.map(([name, description, price], pi) => ({
            groupId: g.id,
            name,
            description,
            price,
            sortOrder: pi,
          })),
        );
      }
      result.services++;
    }
  }
  return result;
}
