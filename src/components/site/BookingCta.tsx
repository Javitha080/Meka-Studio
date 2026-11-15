import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function BookingCta() {
  return (
    <div data-reveal="scale" className="bento-card mt-20 flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center md:p-12">
      <div>
        <div className="label mb-3 !text-signal">Like what you see?</div>
        <h2 className="text-[clamp(28px,4vw,56px)] font-black uppercase leading-none tracking-[-0.03em] text-silver-grad">Let&apos;s film yours next.</h2>
      </div>
      <Link href="/#book" className="btn btn-primary shrink-0" data-cursor="BOOK">
        Book your shoot <ArrowUpRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
