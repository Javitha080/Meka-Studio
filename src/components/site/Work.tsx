"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { VideoPreview } from "@/components/ui/VideoPreview";
import type { ProjectView } from "@/lib/defaults";

const SPANS = [
  "md:col-span-7 aspect-[16/10]",
  "md:col-span-5 aspect-[16/10] md:aspect-auto",
  "md:col-span-4 aspect-[4/5]",
  "md:col-span-4 aspect-[4/5]",
  "md:col-span-4 aspect-[4/5]",
  "md:col-span-12 aspect-[21/9]",
];

export function Work({ projects, limit, standalone = false }: { projects: ProjectView[]; limit?: number; standalone?: boolean }) {
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...Array.from(new Set(projects.map((p) => p.category)))], [projects]);
  const filtered = cat === "All" ? projects : projects.filter((p) => p.category === cat);
  const list = limit && cat === "All" ? filtered.slice(0, limit) : filtered;

  return (
    <section id="work" className={`relative ${standalone ? "pb-[clamp(60px,8vw,120px)] pt-40" : "py-[clamp(80px,12vw,180px)]"}`}>
      <div className="container-x">
        <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="label mb-5 flex items-center gap-3" data-reveal>
              <span className="text-signal">{standalone ? "—" : "02"}</span> Selected work
            </div>
            <SplitHeading as={standalone ? "h1" : "h2"} className="text-[clamp(40px,7vw,104px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">
              Frames that move people.
            </SplitHeading>
          </div>
          <div className="flex flex-wrap gap-2" data-reveal role="tablist" aria-label="Filter projects">
            {cats.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  cat === c ? "border-signal bg-signal text-black" : "border-white/15 text-mute hover:border-white/40 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          {list.map((p, i) => (
            <Link
              key={`${cat}-${p.id}`}
              href={`/work/${p.slug}`}
              data-reveal
              data-cursor="VIEW"
              className={`bento-card group block !rounded-[22px] ${SPANS[i % SPANS.length]}`}
            >
              <div data-parallax="6" className="absolute -inset-y-[8%] inset-x-0">
                <VideoPreview src={p.previewVideoUrl} poster={p.posterUrl} alt={p.title} className="h-full w-full" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 transition-opacity duration-500 group-hover:opacity-70" />
              <div className="vf !inset-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                <span className="glass rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-silver">{p.category}</span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-silver/70">
                  {String(i + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
                </span>
              </div>
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-[clamp(22px,2.6vw,38px)] font-black uppercase leading-none tracking-[-0.02em]">{p.title}</h3>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{[p.client, p.year].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="flex h-12 w-12 shrink-0 translate-y-3 items-center justify-center rounded-full bg-signal text-black opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {limit && projects.length > limit && cat === "All" && (
          <div className="mt-12 flex justify-center" data-reveal>
            <Link href="/work" className="btn btn-ghost" data-cursor="ALL">
              View all {projects.length} projects <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
