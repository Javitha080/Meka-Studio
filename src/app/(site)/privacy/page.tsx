import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  const contact = s.email || s.phonePrimary;
  return (
    <LegalPage title="Privacy policy" updated="2026">
      <p>
        {s.studioName} (&ldquo;we&rdquo;) respects your privacy. This page explains what we collect through this website and how we use it.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Booking requests</strong> — name, e-mail, phone, shoot type, date, location and your message, so we can reply and plan your shoot.
        </li>
        <li>
          <strong>Newsletter</strong> — your e-mail address if you subscribe. You can unsubscribe with one click from any e-mail.
        </li>
        <li>
          <strong>Technical data</strong> — your IP address is used briefly for rate-limiting and spam protection. We do not run advertising trackers.
        </li>
      </ul>
      <h2>How we use it</h2>
      <p>We use your details only to respond to your enquiry, deliver our services and, if you opted in, send occasional studio news. We never sell your data.</p>
      <h2>Service providers</h2>
      <p>
        We use trusted processors: Supabase (database, authentication and file storage), Mailgun (transactional e-mail) and our hosting provider. Embedded videos from YouTube or Vimeo load only when you press play.
      </p>
      <h2>Retention & your rights</h2>
      <p>
        We keep booking records for as long as needed to deliver and support your project. You may ask us to access, correct or delete your data at any time{contact ? <> by contacting <a href={s.email ? `mailto:${s.email}` : `tel:${s.phonePrimary}`}>{contact}</a></> : null}.
      </p>
      <h2>Cookies</h2>
      <p>The public site uses no tracking cookies. The studio CMS uses essential, secure cookies for staff sign-in only.</p>
    </LegalPage>
  );
}
