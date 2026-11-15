import { Plus } from "lucide-react";
import { SplitHeading } from "@/components/ui/SplitHeading";
import type { FaqView } from "@/lib/defaults";

export function Faq({ items }: { items: FaqView[] }) {
  if (!items.length) return null;
  return (
    <section id="faq" className="relative py-[clamp(80px,12vw,180px)]">
      <div className="container-x grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="label mb-5 flex items-center gap-3" data-reveal>
            <span className="text-signal">06</span> FAQ
          </div>
          <SplitHeading className="text-[clamp(40px,6vw,88px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">
            Good questions.
          </SplitHeading>
          <p className="mt-6 max-w-[360px] text-mute" data-reveal>
            Can&apos;t find your answer? Send us a message below — we reply the same day.
          </p>
        </div>
        <div data-stagger="0.07" className="grid gap-3">
          {items.map((f) => (
            <details key={f.id} className="faq bento-card !rounded-3xl">
              <summary className="flex items-center justify-between gap-6 px-6 py-5 text-left text-lg font-bold">
                {f.question}
                <span className="faq-plus icon-chip !h-9 !w-9 shrink-0 transition-transform duration-500">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
              </summary>
              <div className="faq-body">
                <div>
                  <p className="px-6 pb-6 leading-relaxed text-silver/75">{f.answer}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
