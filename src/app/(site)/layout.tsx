import type { ReactNode } from "react";
import { Cursor } from "@/components/ui/Cursor";
import { LiquidGlassDefs } from "@/components/ui/LiquidGlassDefs";
import { Loader } from "@/components/ui/Loader";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { getSettings } from "@/lib/content";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Loader />
      <LiquidGlassDefs />
      <SmoothScroll>
        <Nav name={settings.studioName} announcement={settings.announcement} />
        <main id="main">{children}</main>
        <Footer settings={settings} />
        <FloatingActions whatsapp={settings.whatsapp} studio={settings.studioName} />
      </SmoothScroll>
      <Cursor />
      <div className="grain" aria-hidden />
    </>
  );
}
