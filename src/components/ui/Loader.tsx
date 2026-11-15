"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const TICKS = Array.from({ length: 72 }, (_, i) => i);
const RING_LEN = 2 * Math.PI * 92;

/** Aperture geometry: hexagon + six blade edges, driven by `open` (0 → 1). */
function iris(open: number) {
  const rh = 6 + open * 34;
  const rot = (1 - open) * 70;
  const R = 62;
  const pts: string[] = [];
  const lines: Array<[number, number, number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = ((rot + i * 60) * Math.PI) / 180;
    const vx = Math.cos(a) * rh;
    const vy = Math.sin(a) * rh;
    pts.push(`${vx.toFixed(2)},${vy.toFixed(2)}`);
    const b = a + (110 * Math.PI) / 180;
    lines.push([vx, vy, Math.cos(b) * R, Math.sin(b) * R]);
  }
  return { points: pts.join(" "), lines };
}

export function Loader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const html = document.documentElement;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let seen = false;
      try {
        seen = sessionStorage.getItem("meka-loaded") === "1";
        sessionStorage.setItem("meka-loaded", "1");
      } catch {}
      const quick = reduce || seen;

      html.classList.add("is-loading");
      const q = <T extends Element = HTMLElement>(s: string) => el.querySelector<T>(s)!;
      const hex = q<SVGPolygonElement>(".ld-hex");
      const blades = Array.from(el.querySelectorAll<SVGLineElement>(".ld-blade"));
      const ring = q<SVGCircleElement>(".ld-ring");
      const pct = q(".ld-pct");
      const tc = q(".ld-tc");
      const bar = q(".ld-bar");

      const state = { p: 0, open: 0 };
      const paint = () => {
        const v = Math.round(state.p * 100);
        pct.textContent = String(v).padStart(3, "0");
        ring.style.strokeDashoffset = String(RING_LEN * (1 - state.p));
        bar.style.transform = `scaleX(${state.p})`;
        const f = Math.floor(state.p * 24 * 3);
        tc.textContent = `00:00:${String(Math.floor(f / 24)).padStart(2, "0")}:${String(f % 24).padStart(2, "0")}`;
        const g = iris(state.open);
        hex.setAttribute("points", g.points);
        blades.forEach((l, i) => {
          const [x1, y1, x2, y2] = g.lines[i];
          l.setAttribute("x1", String(x1));
          l.setAttribute("y1", String(y1));
          l.setAttribute("x2", String(x2));
          l.setAttribute("y2", String(y2));
        });
      };
      paint();

      const finish = () => {
        el.style.display = "none";
        html.classList.remove("is-loading");
        html.dataset.loaded = "true";
        window.dispatchEvent(new Event("meka:ready"));
      };

      const tl = gsap.timeline({ onComplete: finish });
      const dur = quick ? 0.5 : 2.0;

      if (!quick) {
        tl.from(".ld-fade", { opacity: 0, y: 18, duration: 0.9, stagger: 0.08, ease: "power3.out" }, 0);
        tl.from(".ld-tick", { opacity: 0, scale: 0.9, duration: 1.2, ease: "expo.out", stagger: { each: 0.004, from: "start" } }, 0.1);
        tl.from(".ld-logo path, .ld-letter", { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.04 }, 0.35);
      }
      tl.to(state, { p: 1, duration: dur, ease: quick ? "none" : "power2.inOut", onUpdate: paint }, 0);
      tl.to(state, { open: 1, duration: dur * 0.85, ease: "power3.inOut", onUpdate: paint }, 0);
      tl.to(".ld-spin", { rotation: 360, duration: dur + 0.8, ease: "none", transformOrigin: "50% 50%" }, 0);

      // exit — iris-wipe reveal of the site underneath
      tl.to(".ld-content", { scale: 1.12, opacity: 0, duration: 0.55, ease: "power3.in" }, `>-0.05`);
      tl.to(el, { "--r": "150vmax", duration: quick ? 0.6 : 1.15, ease: "expo.inOut" }, "<0.1");
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="loader-mask fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
    >
      <noscript>
        <style>{`.loader-mask{display:none!important}`}</style>
      </noscript>

      {/* film perforations */}
      {(["top-5", "bottom-5"] as const).map((pos) => (
        <div key={pos} className={`ld-fade absolute inset-x-0 ${pos} h-3 overflow-hidden opacity-40`}>
          <div
            className="flex w-[calc(100%+56px)] gap-[20px]"
            style={{ animation: "film 0.6s linear infinite" }}
          >
            {Array.from({ length: 90 }, (_, i) => (
              <span key={i} className="h-3 w-2 shrink-0 rounded-[2px] bg-white/60" />
            ))}
          </div>
        </div>
      ))}

      <div className="ld-content relative flex flex-col items-center px-6">
        <div className="relative aspect-square w-[min(72vw,380px)]">
          <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full">
            <g className="ld-spin">
              {TICKS.map((i) => (
                <line
                  key={i}
                  className="ld-tick"
                  x1="0"
                  y1="-98"
                  x2="0"
                  y2={i % 6 === 0 ? -91 : -94.5}
                  stroke={i % 6 === 0 ? "#c9ccd1" : "#555"}
                  strokeWidth={i % 6 === 0 ? 1.2 : 0.7}
                  transform={`rotate(${i * 5})`}
                />
              ))}
            </g>
            <circle cx="0" cy="0" r="92" fill="none" stroke="#1d1d20" strokeWidth="1.5" />
            <circle
              className="ld-ring"
              cx="0"
              cy="0"
              r="92"
              fill="none"
              stroke="#2dff8a"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray={RING_LEN}
              strokeDashoffset={RING_LEN}
              transform="rotate(-90)"
              style={{ filter: "drop-shadow(0 0 5px rgba(45,255,138,.9))" }}
            />
            <circle cx="0" cy="0" r="62" fill="none" stroke="#c9ccd1" strokeOpacity=".5" strokeWidth=".8" />
            <circle cx="0" cy="0" r="40" fill="none" stroke="#c9ccd1" strokeOpacity=".18" strokeWidth=".6" strokeDasharray="2 3" />
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} className="ld-blade" stroke="#e6e7ea" strokeWidth="1.1" strokeLinecap="round" />
            ))}
            <polygon className="ld-hex" fill="rgba(45,255,138,.07)" stroke="#2dff8a" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M-8 -90h16M-90 -8v16M90 -8v16M-8 90h16" stroke="#8a8d94" strokeWidth=".8" />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-[clamp(40px,11vw,64px)] font-light leading-none tracking-tight text-white">
              <span className="ld-pct">000</span>
              <span className="text-signal text-[0.4em] align-top">%</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex overflow-hidden text-center font-black uppercase tracking-[0.34em] text-silver text-[clamp(18px,4.6vw,30px)]">
          {"MEKA STUDIO".split("").map((c, i) => (
            <span key={i} className="ld-letter inline-block" style={{ minWidth: c === " " ? "0.5em" : undefined }}>
              {c}
            </span>
          ))}
        </div>
        <div className="ld-fade label mt-3 flex items-center gap-3">
          <span className="rec-dot inline-block h-2 w-2 rounded-full bg-signal" />
          <span>Rolling · Videography</span>
        </div>

        <div className="ld-fade mt-8 h-px w-[min(70vw,320px)] bg-white/10">
          <div className="ld-bar h-full origin-left scale-x-0 bg-signal" />
        </div>
        <div className="ld-fade mt-3 font-mono text-[11px] tracking-[0.2em] text-mute">
          TC <span className="ld-tc">00:00:00:00</span> · 4K · 25FPS
        </div>
      </div>
    </div>
  );
}
