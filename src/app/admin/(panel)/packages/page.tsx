import { ResourceManager } from "@/components/admin/forms";
import { loadGroupOptions, loadRows } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { RESOURCES } from "@/lib/resources";

export default async function PackagesAdmin() {
  await requireAdmin();
  const [groups, pkgs, opts] = await Promise.all([loadRows("package_groups"), loadRows("packages"), loadGroupOptions()]);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">Packages & prices</h1>
      <p className="mb-10 text-sm text-mute">Groups (e.g. “Weddings”) belong to a service; packages belong to a group.</p>
      <ResourceManager def={RESOURCES.package_groups} rows={groups} opts={opts} />
      <ResourceManager def={RESOURCES.packages} rows={pkgs} opts={opts} />
    </div>
  );
}
