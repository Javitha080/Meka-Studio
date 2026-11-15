"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { Magnetic } from "@/components/ui/Magnetic";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "Process" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#book", label: "Contact" },
];

export function CameraMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="23" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="4.5" />
      <circle cx="41" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="4.5" />
      <rect x="10" y="28" width="34" height="26" rx="5" fill="currentColor" />
      <path d="M47 37l12-6v22l-12-6z" fill="#2dff8a" />
      <path d="M20 47V36l6 8 6-8v11" fill="none" stroke="#000" strokeWidth="3.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Nav({ name, announcement }: { name: string; announcement?: string }) {
  const bar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // close the mobile menu after navigation
  useEffect(() => setOpen(false), [pathname]);

  // hide on scroll down, reveal on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const hide = y > last && y > 160 && !document.documentElement.classList.contains("menu-open");
      gsap.to(bar.current, { yPercent: hide ? -160 : 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // mobile menu (skips the very first run so it never touches Lenis during loading)
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const html = document.documentElement;
    if (open) {
      html.classList.add("menu-open");
      window.__lenis?.stop();
      html.style.overflow = "hidden";
      gsap.set(el, { display: "flex" });
      gsap.fromTo(el, { clipPath: "circle(0% at 92% 4%)" }, { clipPath: "circle(150% at 92% 4%)", duration: 0.9, ease: "expo.inOut" });
      gsap.fromTo(".m-link", { yPercent: 120 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, delay: 0.25 });
    } else {
      html.classList.remove("menu-open");
      html.style.overflow = "";
      if (!html.classList.contains("is-loading")) window.__lenis?.start();
      gsap.to(el, { clipPath: "circle(0% at 92% 4%)", duration: 0.6, ease: "expo.inOut", onComplete: () => void gsap.set(el, { display: "none" }) });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header ref={bar} className="nav-intro fixed inset-x-0 top-0 z-50 flex flex-col items-center px-4 pt-4">
        <nav aria-label="Primary" className="glass glass-liquid flex w-full max-w-[960px] items-center justify-between rounded-full py-2 pl-5 pr-2">
          <Link href="/" className="flex items-center gap-3 text-silver" data-cursor="HOME" aria-label={`${name} home`}>
            <CameraMark />
            <span className="text-[13px] font-extrabold uppercase tracking-[0.28em]">{name}</span>
          </Link>
          <ul className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => {
              const active = l.href === "/work" && pathname.startsWith("/work");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-white ${active ? "text-white" : "text-mute"}`}
                  >
                    {l.label}
                    <span className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-signal transition-transform duration-500 group-hover:scale-x-100 ${active ? "scale-x-100" : "scale-x-0"}`} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <Magnetic strength={0.25}>
                <Link href="/#book" className="btn btn-primary !px-6 !py-3">
                  Book <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Magnetic>
            </div>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
              className="relative z-[60] flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-full border border-white/15 md:hidden"
            >
              <span className={`h-px w-5 bg-white transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
              <span className={`h-px w-5 bg-white transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>
        {announcement && (
          <Link href="/#book" className="glass mt-2 max-w-[92vw] truncate rounded-full px-4 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-silver">
            <span className="mr-2 text-signal">●</span>
            {announcement}
          </Link>
        )}
      </header>

      <div
        id="mobile-menu"
        ref={menu}
        className="glass fixed inset-0 z-[55] flex-col justify-center gap-2 bg-black/90 px-8 md:!hidden"
        style={{ display: "none", clipPath: "circle(0% at 92% 4%)" }}
        data-lenis-prevent
      >
        {LINKS.map((l, i) => (
          <div key={l.href} className="overflow-hidden">
            <Link
              href={l.href}
              onClick={() => setOpen(false)}
              className="m-link block py-2 text-[clamp(44px,13vw,80px)] font-black uppercase leading-none tracking-[-0.03em] text-silver-grad"
            >
              <span className="mr-4 font-mono text-xs font-normal tracking-widest text-signal">0{i + 1}</span>
              {l.label}
            </Link>
          </div>
        ))}
        <Link href="/#book" onClick={() => setOpen(false)} className="btn btn-primary mt-8 self-start">
          Book your shoot
        </Link>
      </div>
    </>
  );
}
