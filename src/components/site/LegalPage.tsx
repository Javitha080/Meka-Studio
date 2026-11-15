import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="pb-24 pt-36 md:pt-44">
      <div className="container-x max-w-3xl">
        <Link href="/" className="label inline-flex items-center gap-3 hover:text-signal">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Home
        </Link>
        <h1 data-reveal className="mb-2 mt-8 text-[clamp(40px,7vw,88px)] font-black uppercase leading-[0.92] tracking-[-0.04em] text-silver-grad">
          {title}
        </h1>
        <p className="label mb-10">Last updated {updated}</p>
        <div data-reveal className="prose-legal bento-card p-8 md:p-12">
          {children}
        </div>
      </div>
    </article>
  );
}
