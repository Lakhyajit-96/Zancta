/** Decorative obsidian / rose-metal line visuals. Pure SVG, no raster weight. */

export function ShieldVisual() {
  return (
    <div className="relative grid place-items-center py-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 perspective-floor opacity-60" />
      <svg viewBox="0 0 320 240" className="relative h-44 w-auto md:h-56" role="img" aria-label="Layered shield representing local processing protection">
        <g fill="none" stroke="#3A383C" strokeWidth="1.2">
          <path d="M160 26 L244 58 v62 c0 52-37 84-84 100-47-16-84-48-84-100V58z" />
          <path d="M160 48 L226 73 v49 c0 41-29 66-66 80-37-14-66-39-66-80V73z" strokeOpacity="0.65" />
        </g>
        <path d="M160 70 L208 88 v36 c0 30-21 48-48 59-27-11-48-29-48-59V88z" fill="rgba(232,160,180,0.07)" stroke="#E8A0B4" strokeOpacity="0.85" strokeWidth="1.2" />
        <path d="M152 118 v-7 a8 8 0 0 1 16 0 v7" fill="none" stroke="#E8A0B4" strokeWidth="1.6" />
        <rect x="148" y="118" width="24" height="18" rx="3" fill="#E8A0B4" fillOpacity="0.9" />
        <circle cx="160" cy="126" r="2.4" fill="#221419" />
      </svg>
    </div>
  );
}

export function LayersVisual() {
  return (
    <div className="relative grid place-items-center py-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 perspective-floor opacity-60" />
      <svg viewBox="0 0 320 240" className="relative h-44 w-auto md:h-56" role="img" aria-label="Stacked layers representing defense in depth">
        <g fill="none" strokeWidth="1.2">
          <path d="M160 40 L250 82 L160 124 L70 82 Z" stroke="#3A383C" />
          <path d="M160 78 L250 120 L160 162 L70 120 Z" stroke="#3A383C" strokeOpacity="0.75" />
          <path d="M160 116 L250 158 L160 200 L70 158 Z" stroke="#E8A0B4" strokeOpacity="0.85" fill="rgba(232,160,180,0.06)" />
          <path d="M250 82 v38 M160 124 v38 M70 82 v38" stroke="#3A383C" strokeOpacity="0.5" />
          <path d="M250 120 v38 M160 162 v38 M70 120 v38" stroke="#3A383C" strokeOpacity="0.35" />
        </g>
        <circle cx="160" cy="82" r="3" fill="#E8A0B4" />
      </svg>
    </div>
  );
}

export function LaptopVisual() {
  return (
    <div className="relative grid place-items-center py-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 perspective-floor opacity-60" />
      <svg viewBox="0 0 360 240" className="relative h-44 w-auto md:h-56" role="img" aria-label="Laptop processing a file locally">
        <g fill="none" strokeWidth="1.2">
          <path d="M110 40 h140 v92 h-140 z" stroke="#3A383C" fill="#121214" />
          <path d="M120 50 h120 v72 h-120 z" stroke="#3A383C" strokeOpacity="0.6" />
          <path d="M96 132 h168 l28 34 H68 z" stroke="#3A383C" fill="#17171A" />
          <path d="M116 142 h128 M110 150 h140 M104 158 h152" stroke="#3A383C" strokeOpacity="0.5" />
        </g>
        <path d="M166 66 h28 v8 l-17 16 h17 v8 h-28 v-8 l17-16 h-17 z" fill="#E8A0B4" fillOpacity="0.9" />
        <path d="M180 176 v22" stroke="#E8A0B4" strokeOpacity="0.6" strokeDasharray="3 4" className="anim-dash-flow" />
        <ellipse cx="180" cy="208" rx="60" ry="8" fill="rgba(232,160,180,0.12)" />
      </svg>
    </div>
  );
}

export function EnvelopeVisual() {
  return (
    <div className="relative grid place-items-center py-4">
      <svg viewBox="0 0 200 140" className="h-32 w-auto" role="img" aria-label="Sealed envelope representing verification email">
        <g fill="none" stroke="#3A383C" strokeWidth="1.2">
          <rect x="30" y="40" width="140" height="80" rx="6" fill="#17171A" />
          <path d="M30 46 L100 92 L170 46" />
        </g>
        <circle cx="100" cy="88" r="12" fill="#0E0E10" stroke="#E8A0B4" strokeOpacity="0.9" strokeWidth="1.2" />
        <path d="M95 88 h10 M100 83 v10" stroke="#E8A0B4" strokeWidth="1.4" />
      </svg>
    </div>
  );
}
