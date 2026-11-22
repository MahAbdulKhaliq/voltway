// Small icons that sit before a button's text (B130, owner 2026-11-20). Decorative: the button's
// text names it. They take the text colour.

/** A route: start dot, a winding road, a pin at the end. For "Plan" and "Plan trip". */
export function RouteIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="btn-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2" />
      <path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H13" />
      <path d="M18 9.5s-3-2.6-3-4.9a3 3 0 0 1 6 0c0 2.3-3 4.9-3 4.9z" />
    </svg>
  );
}

// The two hand-off buttons get different generic shapes that hint at each app (owner 2026-11-20).
// Not the companies' logos: those are trademarks.

/** A teardrop map pin. For "Google Maps". */
export function PinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="btn-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** A folded paper map. For "Apple Maps". */
export function FoldedMapIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="btn-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </svg>
  );
}

/** An itinerary: stops on a line with their rows. For "Return to plan". */
export function PlanIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="btn-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <path d="M5 7v10M10 5h10M10 12h7M10 19h10" />
    </svg>
  );
}

/** Three sliders with their knobs. For "Filters" on the Cars page (owner 2026-11-22). */
export function FilterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="btn-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}
