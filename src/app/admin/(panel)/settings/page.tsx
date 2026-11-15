import { SettingsForm } from "@/components/admin/forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/content";

export default async function SettingsAdmin() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-10 text-4xl font-black uppercase tracking-tight text-silver-grad">Site settings</h1>
      <SettingsForm values={settings as unknown as Record<string, string>} />
    </div>
  );
}
