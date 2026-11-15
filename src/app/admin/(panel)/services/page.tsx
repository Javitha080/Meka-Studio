import { ResourceManager } from "@/components/admin/forms";
import { loadRows } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { RESOURCES } from "@/lib/resources";

export default async function ServicesAdmin() {
  await requireAdmin();
  const rows = await loadRows("services");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-10 text-4xl font-black uppercase tracking-tight text-silver-grad">Services</h1>
      <ResourceManager def={RESOURCES.services} rows={rows} />
    </div>
  );
}
