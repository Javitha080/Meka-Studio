"use client";

import { useState } from "react";
import { parseVideoUrl } from "@/lib/utils";

/** Poster-first player: nothing heavy loads until the visitor presses play. */
export function ProjectPlayer({ poster, title, videoUrl, previewUrl }: { poster: string; title: string; videoUrl: string; previewUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const source = parseVideoUrl(videoUrl || previewUrl);

  return (
    <div className="glass relative aspect-video w-full overflow-hidden rounded-[28px] p-2">
      <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-panel">
        {playing && source.type === "file" ? (
          <video src={source.src} poster={poster || undefined} controls autoPlay playsInline className="h-full w-full bg-black" />
        ) : playing && (source.type === "youtube" || source.type === "vimeo") ? (
          <iframe
            src={source.src}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        ) : (
          <>
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={title} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="vf" />
            {source.type !== "none" && (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                data-cursor="PLAY"
                aria-label={`Play ${title}`}
                className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-signal text-3xl text-black shadow-[0_0_80px_rgba(45,255,138,0.5)] transition-transform duration-500 hover:scale-110"
              >
                ▶
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
