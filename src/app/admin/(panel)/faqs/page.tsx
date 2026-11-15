import { ResourceManager } from "@/components/admin/forms";
import { loadRows } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { RESOURCES } from "@/lib/resources";

export default async function FaqsAdmin() {
  await requireAdmin();
  const rows = await loadRows("faqs");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">FAQ</h1>
      <p className="mb-10 text-sm text-mute">Shown on the home page and marked up for Google rich results.</p>
      <ResourceManager def={RESOURCES.faqs} rows={rows} />
    </div>
  );
}
