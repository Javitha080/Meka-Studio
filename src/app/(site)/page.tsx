import type { Metadata } from "next";
import { About } from "@/components/site/About";
import { BookingForm } from "@/components/site/BookingForm";
import { Faq } from "@/components/site/Faq";
import { Hero } from "@/components/site/Hero";
import { Process } from "@/components/site/Process";
import { Services } from "@/components/site/Services";
import { Testimonials } from "@/components/site/Testimonials";
import { Work } from "@/components/site/Work";
import { getFaqs, getProjects, getServices, getSettings, getTestimonials } from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { absolute: `${s.studioName} — ${s.tagline}` },
    description: s.seoDescription,
    alternates: { canonical: "/" },
    openGraph: { title: `${s.studioName} — ${s.tagline}`, description: s.seoDescription, url: "/", images: s.ogImageUrl ? [s.ogImageUrl] : undefined },
  };
}

export default async function HomePage() {
  const [settings, projects, services, testimonials, faqs] = await Promise.all([
    getSettings(),
    getProjects(),
    getServices(),
    getTestimonials(),
    getFaqs(),
  ]);
  const reel = projects.find((p) => p.featured) ?? projects[0];
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const sameAs = [settings.instagram, settings.facebook, settings.youtube, settings.tiktok].filter(Boolean);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "VideoProductionService",
      "@id": `${siteUrl}/#business`,
      name: settings.studioName,
      url: siteUrl,
      description: settings.seoDescription,
      telephone: settings.phonePrimary,
      email: settings.email || undefined,
      areaServed: settings.location,
      priceRange: "LKR",
      image: settings.ogImageUrl || `${siteUrl}/opengraph-image`,
      sameAs: sameAs.length ? sameAs : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.studioName,
      url: siteUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero settings={settings} reel={reel} />
      <About settings={settings} projectCount={projects.length} />
      <Work projects={projects} limit={6} />
      <Services services={services} depositRule={settings.depositRule} />
      <Process />
      <Testimonials items={testimonials} />
      <Faq items={faqs} />
      <BookingForm phones={[settings.phonePrimary, settings.phoneSecondary]} whatsapp={settings.whatsapp} email={settings.email} />
    </>
  );
}
