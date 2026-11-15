import { ResourceManager } from "@/components/admin/forms";
import { loadRows } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { RESOURCES } from "@/lib/resources";

export default async function TestimonialsAdmin() {
  await requireAdmin();
  const rows = await loadRows("testimonials");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight text-silver-grad">Testimonials</h1>
      <p className="mb-10 text-sm text-mute">The section appears on the homepage once at least one published testimonial exists.</p>
      <ResourceManager def={RESOURCES.testimonials} rows={rows} />
    </div>
  );
}
