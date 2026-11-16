// Pin icons for the charger map (charger-map.md §5): a bolt for Level 3 and a plug for
// Level 2, so the level never depends on colour alone. A temporarily unavailable station
// gets a grey pin with a small "!" mark. The same shapes draw the map icons (canvas) and
// the legend (inline SVG), on a 24-unit grid.

import type { ChargerLevel } from './power-bands.ts';

export const PIN = {
  /** Fill per level; white glyph on top (both ≥ 4.5:1 against white, checked in tests/contrast). */
  fill: { 3: '#C2410C', 2: '#1D4ED8' } as Record<ChargerLevel, string>,
  unavailable: '#6B7280',
  glyph: '#FFFFFF',
  ring: '#FFFFFF',
} as const;

/** Bolt, filled. */
export const BOLT = 'M13.5 3 6 13.5h5L10 21l8-11h-5.2L13.5 3Z';
/** Plug: two prongs, body and cable, stroked. */
export const PLUG = 'M9.5 4v4M14.5 4v4M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5';

export const pinId = (level: ChargerLevel, unavailable: boolean) => `pin-l${level}${unavailable ? '-t' : ''}`;

/** Draws one pin into an ImageData-ready canvas at `ratio` × 28 px. Browser only. */
export function drawPin(level: ChargerLevel, unavailable: boolean, ratio = 2): ImageData {
  const size = 28;
  const c = document.createElement('canvas');
  c.width = c.height = size * ratio;
  const g = c.getContext('2d')!;
  g.scale(ratio, ratio);
  // Ring + disc
  g.beginPath();
  g.arc(14, 14, 13, 0, Math.PI * 2);
  g.fillStyle = PIN.ring;
  g.fill();
  g.beginPath();
  g.arc(14, 14, 11, 0, Math.PI * 2);
  g.fillStyle = unavailable ? PIN.unavailable : PIN.fill[level];
  g.fill();
  // Glyph, centred: the 24-grid scaled to 16 px.
  g.save();
  g.translate(6, 6);
  g.scale(16 / 24, 16 / 24);
  const path = new Path2D(level === 3 ? BOLT : PLUG);
  if (level === 3) {
    g.fillStyle = PIN.glyph;
    g.fill(path);
  } else {
    g.strokeStyle = PIN.glyph;
    g.lineWidth = 2.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.stroke(path);
  }
  g.restore();
  if (unavailable) {
    // "!" badge, top right
    g.beginPath();
    g.arc(22, 6, 5.5, 0, Math.PI * 2);
    g.fillStyle = '#111827';
    g.fill();
    g.strokeStyle = PIN.ring;
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = '#FFFFFF';
    g.fillRect(21.25, 3, 1.5, 4);
    g.fillRect(21.25, 8, 1.5, 1.5);
  }
  return g.getImageData(0, 0, c.width, c.height);
}
