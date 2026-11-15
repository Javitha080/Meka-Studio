"use client";

import "./globals.css";

/** Last-resort boundary — replaces the root layout, so it must render <html>. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="label mb-4 !text-signal">Something went wrong</div>
          <h1 className="text-[clamp(40px,10vw,120px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">Technical difficulties</h1>
          <button onClick={reset} className="btn btn-primary mt-10">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
