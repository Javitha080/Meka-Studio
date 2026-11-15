import { asc } from "drizzle-orm";
import { db } from "@/db";
import { faqs, packageGroups, packages, projects, services, testimonials } from "@/db/schema";
import type { ResourceKey } from "@/lib/resources";

const TABLES = {
  projects,
  services,
  package_groups: packageGroups,
  packages,
  testimonials,
  faqs,
} as const;

export type AdminRow = Record<string, unknown> & { id: string };

/** Rows as plain JSON (safe to pass to client components). */
export async function loadRows(key: ResourceKey): Promise<AdminRow[]> {
  const table = TABLES[key] as typeof projects;
  const rows = await db.select().from(table);
  const plain = JSON.parse(JSON.stringify(rows)) as AdminRow[];
  return plain.sort(
    (a, b) =>
      Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) ||
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
  );
}

export async function loadGroupOptions() {
  const [svc, grp] = await Promise.all([
    db.select().from(services).orderBy(asc(services.sortOrder)),
    db.select().from(packageGroups).orderBy(asc(packageGroups.sortOrder)),
  ]);
  return {
    services: svc.map((s) => ({ value: s.id, label: s.title })),
    package_groups: grp.map((g) => ({
      value: g.id,
      label: `${svc.find((s) => s.id === g.serviceId)?.title ?? "?"} › ${g.title}`,
    })),
  };
}
