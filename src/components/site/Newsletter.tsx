"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

type S = { state: "idle" | "sending" | "done" } | { state: "error"; message: string };

/** Footer newsletter form → /api/subscribe (stored + Mailgun welcome e-mail). */
export function Newsletter() {
  const [status, setStatus] = useState<S>({ state: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) return setStatus({ state: "error", message: json.error ?? "Something went wrong." });
      form.reset();
      setStatus({ state: "done" });
    } catch {
      setStatus({ state: "error", message: "Network error. Try again." });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={status.state === "sending"}>
      <label htmlFor="nl-email" className="label mb-3 block">
        Stay in the frame
      </label>
      <div className="glass flex items-center rounded-full p-1.5 pl-5">
        <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-mute" />
        <div className="absolute -left-[9999px]" aria-hidden>
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <button
          type="submit"
          disabled={status.state === "sending" || status.state === "done"}
          aria-label="Subscribe"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal text-black transition-transform hover:scale-105 disabled:opacity-70"
        >
          {status.state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : status.state === "done" ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      <p role="status" aria-live="polite" className={`mt-2 min-h-5 text-xs ${status.state === "error" ? "text-red-400" : "text-signal"}`}>
        {status.state === "done" && "You're in — check your inbox."}
        {status.state === "error" && status.message}
      </p>
    </form>
  );
}
