"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";

/** Wraps a child so it is gently pulled toward the cursor (React Bits–style "Magnet"). */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: none)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    gsap.to(el, { x, y, duration: 0.5, ease: "power3.out", overwrite: "auto" });
  };
  const leave = () => gsap.to(ref.current, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,.4)" });

  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`inline-block ${className ?? ""}`}>
      {children}
    </div>
  );
}
