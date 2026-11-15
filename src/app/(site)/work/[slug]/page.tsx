import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { BookingCta } from "@/components/site/BookingCta";
import { ProjectPlayer } from "@/components/site/ProjectPlayer";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { getProject, getProjects } from "@/lib/content";
import { isSafeUrl } from "@/lib/utils";

export const revalidate = 60;
export const dynamicParams = true;

// Pages are generated on first request, then cached (ISR) and refreshed by CMS edits.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.title,
    description: p.description.slice(0, 160),
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: { title: p.title, description: p.description.slice(0, 160), type: "article", images: p.posterUrl ? [p.posterUrl] : undefined },
  };
}

const isVideo = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);
const GALLERY_SPANS = ["md:col-span-8 md:row-span-2", "md:col-span-4", "md:col-span-4", "md:col-span-6", "md:col-span-6", "md:col-span-4", "md:col-span-8"];

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProject(slug), getProjects()]);
  if (!project) notFound();

  const idx = all.findIndex((p) => p.slug === project.slug);
  const next = all[(idx + 1) % all.length];
  const prev = all[(idx - 1 + all.length) % all.length];
  const gallery = (project.gallery ?? []).filter(isSafeUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: project.title,
    description: project.description || project.title,
    thumbnailUrl: project.posterUrl || undefined,
    uploadDate: project.year ? `${project.year}-01-01` : undefined,
    contentUrl: /\.(mp4|webm)(\?|$)/i.test(project.fullVideoUrl) ? project.fullVideoUrl : undefined,
  };

  return (
    <article className="pb-24 pt-32 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x">
        <Link href="/work" className="label inline-flex items-center gap-3 transition-colors hover:text-signal" data-cursor="BACK">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All work
        </Link>

        <header className="mb-10 mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <div className="label mb-4 !text-signal" data-reveal data-hero>
              {project.category}
            </div>
            <SplitHeading as="h1" immediate className="text-[clamp(40px,8vw,120px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">
              {project.title}
            </SplitHeading>
          </div>
          <dl data-reveal data-hero data-delay="0.2" className="grid grid-cols-2 gap-6 font-mono text-[11px] uppercase tracking-[0.18em]">
            <div>
              <dt className="text-mute">Client</dt>
              <dd className="mt-1 text-silver">{project.client || "—"}</dd>
            </div>
            <div>
              <dt className="text-mute">Year</dt>
              <dd className="mt-1 text-silver">{project.year ?? "—"}</dd>
            </div>
          </dl>
        </header>

        <div data-reveal="scale">
          <ProjectPlayer poster={project.posterUrl} title={project.title} videoUrl={project.fullVideoUrl} previewUrl={project.previewVideoUrl} />
        </div>

        {project.description && (
          <p data-reveal className="mt-12 max-w-[760px] text-[clamp(18px,2vw,26px)] leading-relaxed text-silver/85">
            {project.description}
          </p>
        )}

        {gallery.length > 0 && (
          <section aria-label="Gallery" className="mt-20">
            <div className="label mb-6" data-reveal>
              Gallery · {gallery.length}
            </div>
            <div data-stagger="0.07" className="grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
              {gallery.map((u, i) => (
                <figure key={`${u}-${i}`} className={`bento-card !rounded-[20px] ${GALLERY_SPANS[i % GALLERY_SPANS.length]} ${i % 7 === 0 ? "col-span-2" : ""}`}>
                  {isVideo(u) ? (
                    <video src={u} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u} alt={`${project.title} — frame ${i + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        <BookingCta />

        {all.length > 1 && (
          <div className="mt-20 grid gap-4 border-t border-white/10 pt-10 md:grid-cols-2">
            <Link href={`/work/${prev.slug}`} data-cursor="PREV" className="group bento-card p-7">
              <div className="label mb-3 flex items-center gap-2">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
              </div>
              <span className="text-[clamp(24px,3vw,44px)] font-black uppercase leading-none tracking-tight transition-colors group-hover:text-signal">{prev.title}</span>
            </Link>
            <Link href={`/work/${next.slug}`} data-cursor="NEXT" className="group bento-card p-7 md:text-right">
              <div className="label mb-3 flex items-center gap-2 md:justify-end">
                Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </div>
              <span className="inline-flex items-center gap-3 text-[clamp(24px,3vw,44px)] font-black uppercase leading-none tracking-tight transition-colors group-hover:text-signal">
                {next.title} <ArrowUpRight className="h-6 w-6" aria-hidden />
              </span>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
