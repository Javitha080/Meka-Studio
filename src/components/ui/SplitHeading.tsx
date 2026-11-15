"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { onSiteReady, prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Line-masked word reveal on scroll.
 * Hidden by CSS until it is split (no flash of un-animated text), waits for web fonts so line
 * breaks are right, and re-splits automatically on resize (autoSplit).
 */
export function SplitHeading({
  as: Tag = "h2",
  children,
  className,
  delay = 0,
  immediate = false,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  /** play right away instead of on scroll (use above the fold) */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      if (prefersReducedMotion()) {
        el.setAttribute("data-rv", "1");
        return;
      }
      let cancelled = false;
      const ready = document.fonts?.ready ?? Promise.resolve();
      ready.then(() => {
        if (cancelled || !ref.current) return;
        SplitText.create(el, {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          linesClass: "split-line",
          onSplit: (self) => {
            el.setAttribute("data-rv", "1");
            const tween = gsap.from(self.words, {
              yPercent: 115,
              rotate: 4,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.045,
              delay,
              paused: immediate,
              scrollTrigger: immediate ? undefined : { trigger: el, start: "top 90%", once: true },
            });
            if (immediate) onSiteReady(() => tween.play());
            return tween;
          },
        });
      });
      return () => {
        cancelled = true;
      };
    },
    { scope: ref, dependencies: [delay, immediate] },
  );

  return (
    <Tag ref={ref} data-split className={className}>
      {children}
    </Tag>
  );
}
