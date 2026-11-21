// "Road unrolls" (B83 overdrive, design-language.md §8), shared by the React Accordion and the static
// Astro sections (B88): opening grows the section, a lane-dash line paints itself under the header
// and the blocks inside rise in a short stagger; closing runs a quicker reverse, and a click
// mid-animation reverses from where it stands. With Animations off (html[data-motion="off"]) the
// native <details> opens and shuts at once.
import { reducedMotion } from './motion.ts';

export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // --ease-out
export const OPEN_MS = 320;
export const SHUT_MS = 220;
export const STAGGER_MS = 30;
export const MAX_STAGGER = 10;
// What rises in sequence: the body's own blocks, and the cards inside a grid of them.
export const RISERS = ':scope > *:not(.readouts):not(.spec-grid):not(.rise-grid), :scope .readouts > *, :scope .spec-grid > *, :scope .selects > *, :scope .rise-grid > *';

const running = new WeakMap<HTMLDetailsElement, Animation[]>();

/** Handles a click on the section's <summary>. Returns without acting when motion is off. */
export function unroll(d: HTMLDetailsElement, b: HTMLElement, e: Event): void {
  if (reducedMotion() || typeof b.animate !== 'function') return; // native, instant
  e.preventDefault();
  const shutting = d.classList.contains('acc-shutting');
  const opening = d.classList.contains('acc-opening');
  const from = shutting || opening ? b.getBoundingClientRect().height : null;
  (running.get(d) ?? []).forEach((a) => a.cancel());
  d.classList.remove('acc-opening', 'acc-shutting');
  if (!d.open || shutting) {
    if (!d.open) d.open = true; // fires toggle
    d.classList.add('acc-opening');
    const h = b.scrollHeight;
    const grow = b.animate(
      [{ height: `${from ?? 0}px`, opacity: from ? 1 : 0 }, { height: `${h}px`, opacity: 1 }],
      { duration: OPEN_MS, easing: EASE },
    );
    const rise = from ? [] : [...b.querySelectorAll<HTMLElement>(RISERS)].slice(0, MAX_STAGGER).map((el, i) =>
      el.animate(
        [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 260, delay: 60 + i * STAGGER_MS, easing: EASE, fill: 'backwards' },
      ),
    );
    running.set(d, [grow, ...rise]);
    grow.finished.then(() => d.classList.remove('acc-opening'), () => d.classList.remove('acc-opening'));
  } else {
    d.classList.add('acc-shutting');
    const h = from ?? b.offsetHeight;
    const shrink = b.animate(
      [{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: SHUT_MS, easing: EASE },
    );
    running.set(d, [shrink]);
    shrink.finished.then(
      () => { d.classList.remove('acc-shutting'); d.open = false; },
      () => d.classList.remove('acc-shutting'),
    );
  }
}

/** Static pages: wire every `details.acc` under root, and open the one a link's #hash points into. */
export function wireUnrolls(root: ParentNode = document): void {
  for (const d of root.querySelectorAll<HTMLDetailsElement>('details.acc[data-unroll]')) {
    if (d.dataset.wired) continue;
    d.dataset.wired = '1';
    const s = d.querySelector<HTMLElement>(':scope > summary');
    const b = d.querySelector<HTMLElement>(':scope > .acc-body');
    if (s && b) s.addEventListener('click', (e) => unroll(d, b, e));
  }
  const openFromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    const d = target?.closest<HTMLDetailsElement>('details.acc');
    if (!target || !d) return;
    if (!d.open) d.open = true; // not animated, so the scroll lands where it should
    target.scrollIntoView({ block: 'start' });
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}
