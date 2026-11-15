"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Camera, Clapperboard, ShieldCheck, Sparkles } from "lucide-react";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { prefersReducedMotion } from "@/lib/motion";
import type { ServiceView } from "@/lib/defaults";

gsap.registerPlugin(useGSAP);

const ICONS = [Clapperboard, Camera, Sparkles];

export function Services({ services, depositRule }: { services: ServiceView[]; depositRule: string }) {
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const current = services[active] ?? services[0];

  // animate the panel whenever the tab changes (skip the first render)
  const first = useRef(true);
  useGSAP(
    () => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (prefersReducedMotion()) return;
      gsap.from(".svc-in", { opacity: 0, y: 36, duration: 0.8, ease: "expo.out", stagger: 0.07, clearProps: "all" });
    },
    { scope: panel, dependencies: [active] },
  );

  if (!current) return null;

  return (
    <section id="services" className="relative py-[clamp(80px,12vw,180px)]">
      <div className="container-x">
        <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="label mb-5 flex items-center gap-3" data-reveal>
              <span className="text-signal">03</span> Services & pricing
            </div>
            <SplitHeading className="text-[clamp(40px,7vw,104px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">
              Clear packages. Honest prices.
            </SplitHeading>
          </div>
          <div className="flex flex-wrap gap-2" data-reveal role="tablist" aria-label="Services">
            {services.map((s, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <button
                  key={s.id}
                  role="tab"
                  id={`tab-${s.id}`}
                  aria-selected={active === i}
                  aria-controls="svc-panel"
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                    active === i ? "border-signal bg-signal text-black" : "border-white/15 text-mute hover:border-white/40 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {s.title}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={panel} id="svc-panel" role="tabpanel" aria-labelledby={`tab-${current.id}`} className="grid gap-4 md:grid-cols-12 md:gap-5">
          <div className="svc-in bento-card flex flex-col justify-between p-8 md:col-span-4 md:p-10">
            <div>
              <div className="font-mono text-6xl font-black text-white/10">{current.number}</div>
              <h3 className="mt-6 text-4xl font-black uppercase leading-none tracking-tight text-silver-grad">{current.title}</h3>
              <p className="mt-4 text-mute">{current.description}</p>
            </div>
            <Link href="/#book" className="btn btn-primary mt-10 self-start" data-cursor="BOOK">
              Book {current.title.toLowerCase()} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-4 md:col-span-8 md:grid-cols-2 md:gap-5">
            {current.groups.map((g) => (
              <div key={g.id} className="svc-in bento-card p-7">
                <h4 className="label !text-signal mb-5">{g.title}</h4>
                <ul className="divide-y divide-white/10">
                  {g.packages.map((p) => (
                    <li key={p.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-bold leading-snug text-silver">{p.name}</span>
                        <span className="shrink-0 text-right font-mono text-[13px] text-signal">{p.price}</span>
                      </div>
                      {p.description && <p className="mt-1 text-sm leading-relaxed text-mute">{p.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="svc-in bento-card flex items-center gap-5 p-6 md:col-span-2">
              <span className="icon-chip shrink-0">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold leading-snug text-silver">{depositRule}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
