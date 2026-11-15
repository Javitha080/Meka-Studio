"use client";

import { useState } from "react";
import { Magnetic } from "@/components/ui/Magnetic";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { telHref } from "@/lib/utils";

const TYPES = ["Videography", "Photography", "Photo + Video"];

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "error"; message: string; field?: string }
  | { state: "done"; whatsappUrl: string | null };

export function BookingForm({
  phones,
  whatsapp,
  email,
}: {
  phones: string[];
  whatsapp: string;
  email: string;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [hasEmail, setHasEmail] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setHasEmail(Boolean(String(data.email ?? "").trim()));
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setStatus({ state: "error", message: json.error ?? "Something went wrong.", field: json.field });
        return;
      }
      form.reset();
      setStatus({ state: "done", whatsappUrl: json.whatsappUrl ?? null });
    } catch {
      setStatus({ state: "error", message: "Network error. Please try again or call us." });
    }
  }

  const err = status.state === "error" ? status : null;
  const L = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <label htmlFor={id} className="label mb-2 block">
      {children}
    </label>
  );

  return (
    <section id="book" className="relative py-[clamp(80px,12vw,180px)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-signal/10 blur-[140px]"
        style={{ animation: "blob 14s ease-in-out infinite" }}
      />
      <div className="container-x grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="label mb-5 flex items-center gap-3" data-reveal>
            <span className="text-signal">07</span> Book
          </div>
          <SplitHeading className="text-[clamp(40px,7vw,104px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">
            Let&apos;s roll.
          </SplitHeading>
          <p className="mt-6 max-w-[420px] text-mute" data-reveal>
            Tell us about your shoot. We reply fast — usually the same day.
          </p>

          <div className="mt-12 border-t border-white/10 pt-8" data-reveal>
            <h3 className="mb-5 text-xl font-extrabold uppercase tracking-wide">Call for more information</h3>
            <div className="flex flex-wrap gap-3">
              {phones.filter(Boolean).map((p) => (
                <a
                  key={p}
                  href={telHref(p)}
                  data-cursor="CALL"
                  className="glass rounded-full px-6 py-3 font-mono text-lg tracking-wider text-silver transition-colors hover:!border-signal hover:text-signal"
                >
                  {p}
                </a>
              ))}
            </div>
            {email && (
              <a href={`mailto:${email}`} className="mt-4 block text-sm text-mute underline underline-offset-4 hover:text-signal">
                {email}
              </a>
            )}
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="glass grid gap-5 rounded-[28px] p-6 sm:grid-cols-2 md:p-9"
          data-reveal
          aria-busy={status.state === "sending"}
        >
          {/* honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden>
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div>
            <L id="b-name">Name</L>
            <input id="b-name" name="name" required autoComplete="name" className="field" aria-invalid={err?.field === "name"} />
          </div>
          <div>
            <L id="b-email">Email (for your confirmation)</L>
            <input id="b-email" name="email" type="email" autoComplete="email" className="field" aria-invalid={err?.field === "email"} />
          </div>
          <div>
            <L id="b-phone">Phone</L>
            <input id="b-phone" name="phone" type="tel" autoComplete="tel" className="field" aria-invalid={err?.field === "phone"} />
          </div>
          <div>
            <L id="b-type">Shoot type</L>
            <select id="b-type" name="shootType" className="field">
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <L id="b-date">Preferred date</L>
            <input id="b-date" name="preferredDate" type="date" className="field [color-scheme:dark]" />
          </div>
          <div>
            <L id="b-loc">Location</L>
            <input id="b-loc" name="location" className="field" />
          </div>
          <div className="sm:col-span-2">
            <L id="b-msg">Tell us about the shoot</L>
            <textarea id="b-msg" name="message" className="field" />
          </div>

          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-4">
              <Magnetic>
                <button type="submit" disabled={status.state === "sending"} className="btn btn-primary disabled:opacity-60" data-cursor="SEND">
                  {status.state === "sending" ? "Sending…" : "Send booking request"}
                  <span aria-hidden>↗</span>
                </button>
              </Magnetic>
            </div>
            <div role="status" aria-live="polite" className="mt-5 text-sm">
              {err && <p className="text-red-400">{err.message}</p>}
              {status.state === "done" && (
                <div className="rounded-2xl border border-signal/40 bg-signal/[0.07] p-5">
                  <p className="font-bold text-signal">Request received — thank you!</p>
                  <p className="mt-1 text-silver/80">We&apos;ve saved your request{hasEmail ? " and sent a confirmation to your inbox" : ""}. We usually reply the same day — want it faster?</p>
                  {status.whatsappUrl && (
                    <a
                      href={status.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost mt-4 !py-3"
                    >
                      Continue on WhatsApp
                    </a>
                  )}
                </div>
              )}
              {status.state === "idle" && whatsapp && (
                <p className="text-mute">Your request is saved securely and you can continue on WhatsApp right after.</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
