"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  poster: string;
  alt: string;
  /** hover: plays on pointer hover (desktop) / when centred in view (touch). always: plays whenever visible. */
  mode?: "hover" | "always";
  className?: string;
}

/**
 * Bandwidth-friendly video preview:
 *  • poster image renders first (lazy)
 *  • the <video> element is only mounted once it is actually needed
 *  • pauses + rewinds when off-screen or un-hovered
 *  • never loads video for reduced-motion or data-saver users
 */
export function VideoPreview({ src, poster, alt, mode = "hover", className }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [fine, setFine] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setAllowed(Boolean(src) && !reduce && !conn?.saveData);
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, [src]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // 15 % visible is enough (tall tiles on small screens may never reach 35 %)
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio > 0.15), {
      threshold: [0, 0.15, 0.5],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const wantPlay = allowed && inView && (mode === "always" || !fine || hover);

  useEffect(() => {
    if (wantPlay) setMounted(true);
  }, [wantPlay]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // React does not reliably reflect the `muted` prop on the DOM node, and browsers refuse to
    // autoplay un-muted video — set it imperatively so playback is deterministic.
    v.muted = true;
    v.defaultMuted = true;
    if (wantPlay) {
      v.play().catch(() => {});
    } else {
      v.pause();
      if (!wantPlay && v.currentTime > 0) v.currentTime = 0;
      setReady(false);
    }
  }, [wantPlay, mounted]);

  return (
    <div
      ref={box}
      className={`relative overflow-hidden bg-panel ${className ?? ""}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {mounted && (
        <video
          ref={video}
          src={src}
          poster={poster || undefined}
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          onPlaying={() => setReady(true)}
          onCanPlay={(e) => {
            // retry if the first play() was rejected before enough data had loaded
            const el = e.currentTarget;
            el.muted = true;
            if (wantPlay && el.paused) el.play().catch(() => {});
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
