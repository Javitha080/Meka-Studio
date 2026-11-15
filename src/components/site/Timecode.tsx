"use client";

import { useEffect, useState } from "react";

/** Running REC timecode HUD. */
export function Timecode() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {p(Math.floor(t / 3600))}:{p(Math.floor(t / 60) % 60)}:{p(t % 60)}:00
    </span>
  );
}
