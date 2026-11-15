import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/content";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Terms of service", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Terms of service" updated="2026">
      <p>These terms apply to bookings made with {s.studioName}. A written quote or confirmation e-mail forms the agreement for each project.</p>
      <h2>Booking & deposit</h2>
      <p>{s.depositRule} Your date is only held once the deposit is received. The balance is due on or before the shoot day unless agreed otherwise.</p>
      <h2>Cancellations & rescheduling</h2>
      <p>Deposits are non-refundable. Dates may be rescheduled once, subject to availability and at least 14 days&apos; notice.</p>
      <h2>Delivery</h2>
      <p>Delivery times are estimates and depend on the package and season. We will keep you updated and offer rush delivery on request.</p>
      <h2>Usage & copyright</h2>
      <p>{s.studioName} retains copyright of all work. Clients receive a personal licence to share and print their films and photos. We may feature work in our portfolio unless you ask us not to.</p>
      <h2>Liability</h2>
      <p>We take every precaution with backups and equipment. In the unlikely event we cannot deliver due to circumstances beyond our control, our liability is limited to the fees paid.</p>
    </LegalPage>
  );
}
