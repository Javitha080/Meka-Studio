"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { onSiteReady, prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * The single motion engine for the public site:
 *  • Lenis smooth-scroll driven by GSAP's ticker (one RAF loop, ScrollTrigger always in sync)
 *  • declarative scroll animations:  data-reveal · data-stagger · data-parallax · data-count
 *  • a MutationObserver so content that streams in later (Suspense, filters, route changes) is
 *    animated too — nothing depends on effect ordering any more
 *  • ScrollTrigger refreshed on load / fonts / images / route change
 *  • global spotlight (--mx/--my) for .bento-card
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* ───── engine (mounted once) ───── */
  useEffect(() => {
    const html = document.documentElement;
    const reduce = prefersReducedMotion();
    if (/Chrome\//.test(navigator.userAgent) && !/Edg|OPR/.test(navigator.userAgent)) html.classList.add("liquid-ok");

    let lenis: Lenis | undefined;
    let tick: ((t: number) => void) | undefined;
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, smoothWheel: true, anchors: false });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      tick = (t) => lenis!.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      if (html.classList.contains("is-loading")) lenis.stop();
    }
    const onReady = () => lenis?.start();
    window.addEventListener("meka:ready", onReady);

    /* ---- reveal scanner (idempotent) ---- */
    const scan = () => {
      if (reduce) {
        document.querySelectorAll<HTMLElement>("[data-reveal],[data-split],[data-count]").forEach((el) => el.setAttribute("data-rv", "1"));
        return;
      }
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-rv])").forEach((el) => {
        el.setAttribute("data-rv", "1");
        const kind = el.dataset.reveal;
        const delay = Number(el.dataset.delay ?? 0);
        const from: gsap.TweenVars = { opacity: 0, y: 40 };
        if (kind === "left") Object.assign(from, { y: 0, x: -50 });
        if (kind === "right") Object.assign(from, { y: 0, x: 50 });
        if (kind === "scale") Object.assign(from, { y: 20, scale: 0.92 });
        if (kind === "blur") Object.assign(from, { y: 24, filter: "blur(14px)" });
        // data-hero → above-the-fold: wait for the loader, then play (never behind the loader)
        const hero = el.hasAttribute("data-hero");
        const tween = gsap.fromTo(el, from, {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.15,
          delay,
          ease: "expo.out",
          clearProps: "transform,filter",
          paused: hero,
          scrollTrigger: hero ? undefined : { trigger: el, start: "top 92%", once: true },
        });
        if (hero) onSiteReady(() => tween.play());
      });

      document.querySelectorAll<HTMLElement>("[data-stagger]:not([data-rv])").forEach((wrap) => {
        wrap.setAttribute("data-rv", "1");
        const kids = Array.from(wrap.children) as HTMLElement[];
        gsap.fromTo(
          kids,
          { opacity: 0, y: 50, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: "expo.out",
            stagger: Number(wrap.dataset.stagger) || 0.08,
            clearProps: "transform",
            scrollTrigger: { trigger: wrap, start: "top 88%", once: true },
          },
        );
      });

      document.querySelectorAll<HTMLElement>("[data-parallax]:not([data-rv])").forEach((el) => {
        el.setAttribute("data-rv", "1");
        const amount = Number(el.dataset.parallax) || 10;
        gsap.fromTo(
          el,
          { yPercent: -amount },
          { yPercent: amount, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });

      document.querySelectorAll<HTMLElement>("[data-count]:not([data-rv])").forEach((el) => {
        el.setAttribute("data-rv", "1");
        const target = Number(el.dataset.count) || 0;
        const suffix = el.dataset.suffix ?? "";
        const state = { v: 0 };
        el.textContent = `0${suffix}`;
        gsap.to(state, {
          v: target,
          duration: 2,
          ease: "power3.out",
          onUpdate: () => (el.textContent = `${Math.round(state.v)}${suffix}`),
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
    };

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    scan();
    html.dataset.animReady = "1";

    /* ---- refresh when layout shifts (fonts, images, video metadata) ---- */
    let refreshTimer = 0;
    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => {});
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);

    /* ---- anchor links ---- */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
      const el = document.querySelector<HTMLElement>(url.hash);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
      else el.scrollIntoView({ behavior: "auto" });
      history.replaceState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    /* ---- spotlight for bento cards ---- */
    let sp = 0;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".bento-card");
      if (!card) return;
      cancelAnimationFrame(sp);
      sp = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });

    /* ---- progress bar ---- */
    const progress = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
      },
    });

    // hard safety net: never leave scrolling locked
    const unlock = window.setTimeout(() => {
      if (html.classList.contains("is-loading")) {
        html.classList.remove("is-loading");
        lenis?.start();
      }
    }, 9000);

    return () => {
      window.clearTimeout(unlock);
      window.clearTimeout(refreshTimer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sp);
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("load", refresh);
      window.removeEventListener("meka:ready", onReady);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointermove", onMove);
      progress.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      delete window.__lenis;
      delete html.dataset.animReady;
    };
  }, []);

  /* ───── route changes: reset scroll, honour #hash, refresh triggers ───── */
  useEffect(() => {
    const hash = window.location.hash;
    const go = () => {
      const target = hash ? document.querySelector<HTMLElement>(hash) : null;
      if (target) window.__lenis ? window.__lenis.scrollTo(target, { offset: -70, immediate: true }) : target.scrollIntoView();
      else if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
      // drop triggers whose elements left the DOM with the previous page
      ScrollTrigger.getAll().forEach((t) => {
        const el = t.trigger as Element | undefined;
        if (el && !el.isConnected) t.kill();
      });
      ScrollTrigger.refresh();
    };
    const t = window.setTimeout(go, 60);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <div
        ref={bar}
        aria-hidden
        className="fixed left-0 top-0 z-[70] h-[2px] w-full origin-left scale-x-0 bg-signal shadow-[0_0_14px_rgba(45,255,138,0.9)]"
      />
      {children}
    </>
  );
}
