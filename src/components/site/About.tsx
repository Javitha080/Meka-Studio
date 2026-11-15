import { Aperture, Camera, Clapperboard, MapPin, Plane, Quote, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { SplitHeading } from "@/components/ui/SplitHeading";
import type { SiteSettings } from "@/lib/validation";

const SKILLS = [
  [Clapperboard, "Cinematic films"],
  [Camera, "Photography"],
  [Plane, "Drone"],
  [Sparkles, "Colour grading"],
  [Aperture, "Live events"],
] as const;

export function About({ settings, projectCount }: { settings: SiteSettings; projectCount: number }) {
  return (
    <section id="about" className="relative py-[clamp(80px,12vw,180px)]">
      <div className="container-x">
        <div className="label mb-5 flex items-center gap-3" data-reveal>
          <span className="text-signal">01</span> About
        </div>
        <div data-stagger="0.09" className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          <div className="bento-card p-8 md:col-span-7 md:row-span-2 md:p-12">
            <Quote className="mb-6 h-10 w-10 text-signal" aria-hidden />
            <SplitHeading as="p" className="text-[clamp(28px,4vw,60px)] font-black leading-[1.05] tracking-[-0.035em] text-silver-grad">
              {settings.bioQuote}
            </SplitHeading>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-mute">— {settings.studioName}</p>
          </div>

          <div className="bento-card flex flex-col justify-between p-7 md:col-span-5">
            <span className="icon-chip">
              <Zap className="h-5 w-5" aria-hidden />
            </span>
            <div className="mt-8 flex items-end gap-8">
              <div>
                <div className="text-6xl font-black tracking-tighter text-silver-grad">
                  <span data-count={Math.max(projectCount, 6)} data-suffix="+">
                    {Math.max(projectCount, 6)}+
                  </span>
                </div>
                <div className="label mt-1">Stories filmed</div>
              </div>
              <div>
                <div className="text-6xl font-black tracking-tighter text-signal">24h</div>
                <div className="label mt-1">Reply time</div>
              </div>
            </div>
          </div>

          <div className="bento-card p-7 md:col-span-5">
            <div className="label mb-4">What we shoot</div>
            <ul className="flex flex-wrap gap-2">
              {SKILLS.map(([Icon, label]) => (
                <li key={label} className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-silver">
                  <Icon className="h-4 w-4 text-signal" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="bento-card flex items-center gap-5 p-7 md:col-span-4">
            <span className="icon-chip shrink-0">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="label">Based in</div>
              <div className="text-xl font-extrabold">{settings.location}</div>
              <div className="text-sm text-mute">Available to travel</div>
            </div>
          </div>

          <div className="bento-card flex items-start gap-5 p-7 md:col-span-8">
            <span className="icon-chip shrink-0">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="label">How we lock your date</div>
              <p className="mt-1 text-lg font-semibold leading-snug text-silver">{settings.depositRule}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
