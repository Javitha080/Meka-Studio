"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";

/** Floating WhatsApp shortcut + back-to-top (appears after the first screen). */
export function FloatingActions({ whatsapp, studio }: { whatsapp: string; studio: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const digits = whatsapp.replace(/\D/g, "");
  return (
    <div className={`fixed bottom-5 right-5 z-[55] flex flex-col gap-3 transition-all duration-500 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => (window.__lenis ? window.__lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0 }))}
        className="glass flex h-12 w-12 items-center justify-center rounded-full text-silver transition-colors hover:text-signal"
      >
        <ArrowUp className="h-5 w-5" aria-hidden />
      </button>
      {digits && (
        <a
          href={`https://wa.me/${digits}?text=${encodeURIComponent(`Hi ${studio}, I'd like to book a shoot.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          data-cursor="CHAT"
          className="pulse-ring flex h-12 w-12 items-center justify-center rounded-full bg-signal text-black transition-transform hover:scale-110"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
        </a>
      )}
    </div>
  );
}
