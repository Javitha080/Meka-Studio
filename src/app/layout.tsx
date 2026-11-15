import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/archivo";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Meka Studio — Videography & Photography",
    template: "%s · Meka Studio",
  },
  description: "Meka Studio — cinematic wedding films, event videography and photography. Book your shoot today.",
  applicationName: "Meka Studio",
  keywords: ["wedding videography", "photography", "cinematic wedding film", "event videography", "Sri Lanka", "Meka Studio"],
  authors: [{ name: "Meka Studio" }],
  openGraph: {
    type: "website",
    siteName: "Meka Studio",
    title: "Meka Studio — Videography & Photography",
    description: "I don't just record video; I capture the feeling of the room.",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/brand/icon.svg", apple: "/apple-icon" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Runs before first paint. `anim` hides [data-reveal] elements until the motion engine
 * takes over; the timer removes it if JS never boots, so content can never stay hidden.
 */
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('anim');setTimeout(function(){if(!d.dataset.animReady)d.classList.remove('anim')},7000)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
