import type { ReactNode } from "react";

/** Pure-CSS infinite ticker (duplicated track → seamless loop). Pauses on hover. */
export function Marquee({
  children,
  duration = 40,
  gap = 20,
  reverse = false,
  className = "",
}: {
  children: ReactNode;
  duration?: number;
  gap?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`marquee ${reverse ? "reverse" : ""} ${className}`} style={{ ["--dur" as string]: `${duration}s`, ["--gap" as string]: `${gap}px` }}>
      <div className="marquee-track">
        <div className="flex shrink-0 items-center" style={{ gap }}>
          {children}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
