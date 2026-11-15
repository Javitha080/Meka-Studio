"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";

/** Card with a cursor-following spotlight + edge glow (React Bits "SpotlightCard" style). */
export function SpotlightCard({
  children,
  className = "",
  ...rest
}: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={`group/spot relative overflow-hidden ${className}`}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(45,255,138,0.13), rgba(255,255,255,0.05) 40%, transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
