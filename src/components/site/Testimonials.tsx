import { Quote, Star } from "lucide-react";
import { Marquee } from "@/components/ui/Marquee";
import { SplitHeading } from "@/components/ui/SplitHeading";
import type { TestimonialView } from "@/lib/defaults";

export function Testimonials({ items }: { items: TestimonialView[] }) {
  if (!items.length) return null;
  const loop = items.length < 4 ? [...items, ...items, ...items] : items;
  return (
    <section id="reviews" className="relative overflow-hidden py-[clamp(80px,12vw,180px)]">
      <div className="container-x mb-14">
        <div className="label mb-5 flex items-center gap-3" data-reveal>
          <span className="text-signal">05</span> Kind words
        </div>
        <SplitHeading className="text-[clamp(40px,7vw,104px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">
          Loved by our clients.
        </SplitHeading>
      </div>
      <Marquee duration={Math.max(40, loop.length * 12)} gap={20}>
        {loop.map((t, i) => (
          <figure key={`${t.id}-${i}`} className="bento-card flex w-[min(86vw,420px)] shrink-0 flex-col justify-between gap-6 p-7">
            <div className="flex items-center justify-between">
              <Quote className="h-7 w-7 text-signal" aria-hidden />
              <span className="flex gap-0.5 text-signal" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
                ))}
              </span>
            </div>
            <blockquote className="text-lg leading-relaxed text-silver">{t.quote}</blockquote>
            <figcaption>
              <div className="font-extrabold">{t.name}</div>
              {t.role && <div className="label mt-0.5">{t.role}</div>}
            </figcaption>
          </figure>
        ))}
      </Marquee>
    </section>
  );
}
