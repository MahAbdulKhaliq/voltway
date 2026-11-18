// Motion helpers (overdrive "Night Drive", B64). Every animation checks reducedMotion() or an
// html[data-motion="off"] CSS rule. The switch is the site's own Animations setting (B65, on by
// default; scripts/motion-client.ts), not the operating system's reduce-motion signal.

import { flushSync } from 'react-dom';

/** True when the visitor turned Animations off in Settings. */
export const reducedMotion = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.motion === 'off';

/**
 * Camera options for MapLibre moves. MapLibre skips animation on its own when the device asks for
 * reduced motion; the site setting decides instead: animate (essential) when on, jump when off.
 */
export const camMotion = () => (reducedMotion() ? { duration: 0 } : { essential: true });

type WithViewTransition = Document & { startViewTransition?: (cb: () => void) => unknown };

/**
 * Runs a React state change inside a View Transition, so elements sharing a view-transition-name
 * (the right-hand panel: Stations in view ↔ a station's details) slide into each other. Browsers
 * without the API, and reduced motion, just apply the change.
 */
export function morph(change: () => void, direction: 'forward' | 'back' = 'forward', scope: 'side' | 'left' = 'side') {
  const d = document as WithViewTransition;
  if (!d.startViewTransition || reducedMotion()) {
    change();
    return;
  }
  // The direction picks the slide (global.css): forward goes left, back slides the list back in.
  const root = document.documentElement;
  root.dataset.vt = direction;
  root.dataset.vtScope = scope; // only that panel gets a view-transition-name (global.css)
  const vt = d.startViewTransition(() => flushSync(change)) as { finished?: Promise<unknown> } | undefined;
  const done = () => { if (root.dataset.vt === direction) { delete root.dataset.vt; delete root.dataset.vtScope; } };
  if (vt?.finished) vt.finished.then(done, done);
  else done();
}
