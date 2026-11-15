/** SVG refraction filter used by `.glass-liquid` (Chromium); other browsers fall back to blur. */
export function LiquidGlassDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <defs>
        <filter id="liquid-glass" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
