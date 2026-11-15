/** Small helpers shared by the animation components. */

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Runs `cb` once the loader has finished. Resolves immediately if the loader is already done
 * and always falls back after `max` ms, so intro animations can never be skipped or stuck.
 */
export function onSiteReady(cb: () => void, max = 4500): () => void {
  const html = document.documentElement;
  if (html.dataset.loaded === "true" || !html.classList.contains("is-loading")) {
    cb();
    return () => {};
  }
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    window.removeEventListener("meka:ready", fire);
    window.clearTimeout(t);
    cb();
  };
  const t = window.setTimeout(fire, max);
  window.addEventListener("meka:ready", fire, { once: true });
  return () => {
    done = true;
    window.removeEventListener("meka:ready", fire);
    window.clearTimeout(t);
  };
}
