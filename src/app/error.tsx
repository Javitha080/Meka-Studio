"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="label mb-4 !text-signal">Something went wrong</div>
      <h1 className="text-[clamp(40px,10vw,120px)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-silver-grad">Technical difficulties</h1>
      <div className="mt-10 flex gap-3">
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </div>
    </main>
  );
}
