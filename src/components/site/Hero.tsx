import Link from "next/link";
import { ArrowDown, ArrowUpRight, MapPin, Play } from "lucide-react";
import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { VideoPreview } from "@/components/ui/VideoPreview";
import { Timecode } from "@/components/site/Timecode";
import type { ProjectView } from "@/lib/defaults";
import type { SiteSettings } from "@/lib/validation";

const KEYWORDS = ["Wedding films", "Photography", "Events", "Drone", "Brand stories", "Pre-shoots", "Colour grading", "Highlight reels"];

export function Hero({ settings, reel }: { settings: SiteSettings; reel?: ProjectView }) {
  const words = settings.heroHeadline.trim().split(/\s+/);
  const last = words.pop() ?? "";

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pt-32">
      {/* background reel */}
      <div className="absolute inset-0 -z-10">
        <VideoPreview src={settings.heroVideoUrl} poster={settings.heroPosterUrl} alt="" mode="always" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_100%,rgba(45,255,138,0.12),transparent_60%)]" />
      </div>
      <div className="vf" aria-hidden />

      <div className="container-x relative grid gap-10 pb-10 lg:grid-cols-[1fr_380px] lg:items-end">
        <div>
          <div data-reveal data-hero className="glass mb-8 inline-flex items-center gap-3 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            <span className="rec-dot h-2 w-2 rounded-full bg-red-500" aria-hidden /> REC <Timecode />
            <span className="hidden text-mute sm:inline">· {settings.tagline}</span>
          </div>

          <SplitHeading as="h1" immediate className="max-w-[1000px] text-[clamp(44px,8.6vw,132px)] font-black uppercase leading-[0.88] tracking-[-0.045em] text-silver-grad">
            {words.join(" ")} <span className="text-signal [-webkit-text-fill-color:var(--signal)]">{last}</span>
          </SplitHeading>

          <p data-reveal data-hero data-delay="0.3" className="mt-7 max-w-[560px] text-[clamp(16px,1.5vw,20px)] leading-relaxed text-silver/80">
            {settings.heroSub}
          </p>

          <div data-reveal data-hero data-delay="0.45" className="mt-9 flex flex-wrap items-center gap-4">
            <Magnetic>
              <Link href="/#book" className="btn btn-primary" data-cursor="BOOK">
                Book your shoot <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href={reel ? `/work/${reel.slug}` : "/work"} className="btn btn-ghost" data-cursor="PLAY">
                <Play className="h-4 w-4" aria-hidden /> Watch the reel
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* bento glass stack */}
        <div data-stagger="0.12" className="hidden gap-4 lg:grid">
          {reel && (
            <Link href={`/work/${reel.slug}`} data-cursor="VIEW" className="bento-card group block aspect-[4/3] p-2">
              <div className="relative h-full w-full overflow-hidden rounded-[22px]">
                <VideoPreview src={reel.previewVideoUrl} poster={reel.posterUrl} alt={reel.title} className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
                  <div>
                    <div className="label !text-signal">Now playing</div>
                    <div className="mt-1 text-lg font-black uppercase leading-none tracking-tight">{reel.title}</div>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-signal text-black transition-transform group-hover:scale-110">
                    <Play className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="bento-card flex items-center gap-3 p-4">
              <span className="relative flex h-3 w-3">
                <span className="pulse-ring absolute inset-0 rounded-full bg-signal" />
                <span className="relative h-3 w-3 rounded-full bg-signal" />
              </span>
              <div>
                <div className="text-sm font-bold">Booking open</div>
                <div className="label !text-[9px]">{new Date().getFullYear()} dates</div>
              </div>
            </div>
            <div className="bento-card flex items-center gap-3 p-4">
              <MapPin className="h-5 w-5 text-signal" aria-hidden />
              <div className="min-w-0 text-sm font-bold">
                <div className="truncate">{settings.location}</div>
                <div className="label !text-[9px]">& worldwide</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/40 py-4 backdrop-blur-md">
        <Marquee duration={50} gap={48}>
          {KEYWORDS.map((k) => (
            <span key={k} className="flex items-center gap-12 font-mono text-[11px] uppercase tracking-[0.3em] text-mute">
              {k}
              <span className="h-1 w-1 rounded-full bg-signal" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>
      <a href="#about" aria-label="Scroll down" className="absolute bottom-20 right-6 hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 text-silver transition-colors hover:border-signal hover:text-signal md:flex">
        <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
