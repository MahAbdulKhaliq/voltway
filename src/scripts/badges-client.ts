// Source badges are <details> elements. Keep at most one open: opening a badge closes the
// others, and a click outside or Escape closes it. Listens on the document, so it also
// covers badges React renders later (the Charging tab).

export function initBadges(doc: Document = document): void {
  const openBadges = () => [...doc.querySelectorAll<HTMLDetailsElement>('details.badge[open]')];

  // "toggle" doesn't bubble, so listen in the capture phase.
  doc.addEventListener(
    'toggle',
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLDetailsElement) || !el.classList.contains('badge') || !el.open) return;
      for (const other of openBadges()) if (other !== el) other.open = false;
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
