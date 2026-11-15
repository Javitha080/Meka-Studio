import { ResourceManager } from "@/components/admin/forms";
import { loadRows } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { RESOURCES } from "@/lib/resources";

export default async function ProjectsAdmin() {
  await requireAdmin();
  const rows = await loadRows("projects");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">Portfolio</h1>
      <p className="mb-10 max-w-2xl text-sm text-mute">
        Add a short muted loop (MP4, 3–8 s, under ~4 MB) for hover previews, a poster image, and a YouTube / Vimeo / MP4 link for the full film.
      </p>
      <ResourceManager def={RESOURCES.projects} rows={rows} />
    </div>
  );
}
