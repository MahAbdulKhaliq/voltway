// Source badges are <details> elements. Keep at most one open: opening a badge closes the
// others, and a click outside or Escape closes it. Listens on the document, so it also
// covers badges React renders later (the Charging tab).

const MARGIN = 8; // px kept clear of the screen edge

/**
 * A popover opens from its badge's left edge; near the right edge of a phone screen it would be
 * cut off (7.2). Shift it left just enough to fit, never past the left edge.
 */
export function keepInView(pop: HTMLElement | null, doc: Document = document): void {
  if (!pop) return;
  pop.style.left = '';
  const viewport = doc.documentElement.clientWidth;
  const r = pop.getBoundingClientRect();
  const over = r.right - (viewport - MARGIN);
  if (over <= 0) return;
  const shift = Math.min(over, r.left - MARGIN);
  if (shift > 0) pop.style.left = `${-shift}px`;
}

export function initBadges(doc: Document = document): void {
  const openBadges = () => [...doc.querySelectorAll<HTMLDetailsElement>('details.badge[open]')];

  // "toggle" doesn't bubble, so listen in the capture phase.
  doc.addEventListener(
    'toggle',
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLDetailsElement) || !el.classList.contains('badge') || !el.open) return;
      for (const other of openBadges()) if (other !== el) other.open = false;
      keepInView(el.querySelector<HTMLElement>('.pop'), doc);
    },
    true,
  );

  doc.addEventListener('click', (e) => {
    const inside = (e.target as Element | null)?.closest?.('details.badge');
    for (const b of openBadges()) if (b !== inside) b.open = false;
  });

  doc.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = openBadges();
    open.forEach((b) => (b.open = false));
    open[0]?.querySelector('summary')?.focus();
  });
}
