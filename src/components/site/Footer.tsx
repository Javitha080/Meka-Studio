import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Marquee } from "@/components/ui/Marquee";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "@/components/ui/SocialIcons";
import { CameraMark } from "@/components/site/Nav";
import { Newsletter } from "@/components/site/Newsletter";
import { telHref } from "@/lib/utils";
import type { SiteSettings } from "@/lib/validation";

export function Footer({ settings }: { settings: SiteSettings }) {
  const socials = [
    { label: "Instagram", url: settings.instagram, Icon: InstagramIcon },
    { label: "Facebook", url: settings.facebook, Icon: FacebookIcon },
    { label: "YouTube", url: settings.youtube, Icon: YoutubeIcon },
    { label: "TikTok", url: settings.tiktok, Icon: TiktokIcon },
  ].filter((s) => s.url);
  const wa = settings.whatsapp.replace(/\D/g, "");
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 pt-24">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-signal/[0.07] blur-[140px]" />
      <div className="container-x">
        {/* CTA band */}
        <div data-reveal="scale" className="bento-card mb-6 flex flex-col items-start justify-between gap-8 p-8 md:flex-row md:items-center md:p-12">
          <div>
            <div className="label mb-3 !text-signal">Ready when you are</div>
            <h2 className="text-[clamp(32px,5vw,72px)] font-black uppercase leading-[0.95] tracking-[-0.04em] text-silver-grad">Let&apos;s make something unforgettable.</h2>
          </div>
          <Link href="/#book" className="btn btn-primary shrink-0" data-cursor="BOOK">
            Start a booking <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {/* bento footer */}
        <div data-stagger="0.08" className="grid gap-4 md:grid-cols-12 md:gap-5">
          <div className="bento-card flex flex-col justify-between gap-8 p-7 md:col-span-5">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 text-silver" aria-label={`${settings.studioName} home`}>
                <CameraMark className="h-9 w-9" />
                <span className="text-sm font-extrabold uppercase tracking-[0.28em]">{settings.studioName}</span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">{settings.seoDescription}</p>
            </div>
            {socials.length > 0 && (
              <ul className="flex gap-2">
                {socials.map(({ label, url, Icon }) => (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} data-cursor={label.toUpperCase()} className="glass flex h-11 w-11 items-center justify-center rounded-full text-silver transition-colors hover:border-signal hover:text-signal">
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bento-card p-7 md:col-span-3">
            <div className="label mb-4">Explore</div>
            <ul className="grid gap-2.5 text-sm text-silver">
              {[
                ["Work", "/work"],
                ["Services", "/#services"],
                ["Process", "/#process"],
                ["FAQ", "/#faq"],
                ["Book a shoot", "/#book"],
              ].map(([l, h]) => (
                <li key={h}>
                  <Link href={h} className="transition-colors hover:text-signal">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="bento-card p-7 md:col-span-4">
            <div className="label mb-4">Contact</div>
            <ul className="grid gap-3 text-sm text-silver">
              {[settings.phonePrimary, settings.phoneSecondary].filter(Boolean).map((p) => (
                <li key={p}>
                  <a href={telHref(p)} className="flex items-center gap-3 transition-colors hover:text-signal">
                    <Phone className="h-4 w-4 text-signal" aria-hidden /> {p}
                  </a>
                </li>
              ))}
              {wa && (
                <li>
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 transition-colors hover:text-signal">
                    <MessageCircle className="h-4 w-4 text-signal" aria-hidden /> WhatsApp
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-3 break-all transition-colors hover:text-signal">
                    <Mail className="h-4 w-4 shrink-0 text-signal" aria-hidden /> {settings.email}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3 text-mute">
                <MapPin className="h-4 w-4 text-signal" aria-hidden /> {settings.location}
              </li>
            </ul>
          </div>

          <div className="bento-card p-7 md:col-span-12">
            <div className="grid items-end gap-8 md:grid-cols-[1fr_420px]">
              <p className="max-w-xl text-[clamp(18px,2vw,26px)] font-bold leading-snug text-silver">New films, behind-the-scenes and booking offers — a few times a year, never spam.</p>
              <Newsletter />
            </div>
          </div>
        </div>

        <div className="mt-16 overflow-hidden" aria-hidden>
          <Marquee duration={60} gap={60}>
            {[settings.studioName, "Videography", "Photography", settings.studioName, "Cinematic", "Stories"].map((w, i) => (
              <span key={i} className="select-none text-[clamp(60px,12vw,200px)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-transparent [-webkit-text-stroke:1px_rgba(201,204,209,0.18)]">
                {w}
              </span>
            ))}
          </Marquee>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 font-mono text-[11px] uppercase tracking-[0.18em] text-mute md:flex-row">
          <span>
            © {year} {settings.studioName} · All rights reserved
          </span>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-signal">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-signal">
              Terms
            </Link>
            <Link href="/sitemap.xml" className="transition-colors hover:text-signal">
              Sitemap
            </Link>
            <Link href="/admin" className="transition-colors hover:text-signal">
              Studio login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
