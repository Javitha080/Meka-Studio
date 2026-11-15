"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Mouse-follow cursor: a green dot + silver ring. Hovering anything with
 * `data-cursor="LABEL"` grows the ring into a liquid-glass pill showing the label.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    document.documentElement.classList.add("has-cursor");

    const d = dot.current!;
    const r = ring.current!;
    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 0 });
    const dx = gsap.quickTo(d, "x", { duration: 0.08, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.08, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });

    let shown = false;
    const move = (e: MouseEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    const over = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button, [role='button']");
      const text = t?.dataset.cursor;
      if (text) {
        label.current!.textContent = text;
        gsap.to(r, { width: 92, height: 92, duration: 0.45, ease: "expo.out" });
        gsap.to(label.current, { opacity: 1, duration: 0.25 });
        gsap.to(d, { scale: 0, duration: 0.2 });
        r.dataset.mode = "label";
      } else if (t) {
        gsap.to(r, { width: 56, height: 56, duration: 0.4, ease: "expo.out" });
        gsap.to(label.current, { opacity: 0, duration: 0.15 });
        gsap.to(d, { scale: 1, duration: 0.2 });
        r.dataset.mode = "link";
      } else {
        gsap.to(r, { width: 34, height: 34, duration: 0.4, ease: "expo.out" });
        gsap.to(label.current, { opacity: 0, duration: 0.15 });
        gsap.to(d, { scale: 1, duration: 0.2 });
        r.dataset.mode = "";
      }
    };
    const leave = () => {
      shown = false;
      gsap.to([d, r], { opacity: 0, duration: 0.2 });
    };
    const down = () => gsap.to(r, { scale: 0.85, duration: 0.15 });
    const up = () => gsap.to(r, { scale: 1, duration: 0.4, ease: "elastic.out(1,.5)" });

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", over, { passive: true });
    document.addEventListener("mouseleave", leave);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseleave", leave);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="glass pointer-events-none fixed left-0 top-0 z-[90] hidden h-[34px] w-[34px] items-center justify-center rounded-full data-[mode=link]:border-signal [@media(hover:hover)_and_(pointer:fine)]:flex"
      >
        <span ref={label} className="relative z-10 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-0" />
      </div>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[91] hidden h-[6px] w-[6px] rounded-full bg-signal shadow-[0_0_12px_#2dff8a] [@media(hover:hover)_and_(pointer:fine)]:block"
      />
    </>
  );
}
