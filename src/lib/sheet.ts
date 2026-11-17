// The map's bottom sheet on phones (B59): three heights, peek, half and full, chosen by dragging
// its handle or stepping through them with a tap or the keyboard. Pure numbers here; the
// component measures the map and applies them.

export type SheetSnap = 'peek' | 'half' | 'full';
export const SNAPS: readonly SheetSnap[] = ['peek', 'half', 'full'];

/** Phones, upright or sideways: wider screens keep the floating side panel. Keep in step with global.css. */
export const SHEET_MEDIA = '(max-width: 640px), (max-height: 480px) and (pointer: coarse)';
/** Room kept above the full sheet for the navigation pill. */
export const SHEET_TOP_GAP = 72;
/** Peek shows the handle, the search, Chargers and the station count (or a trip's heading and summary). */
export const SHEET_PEEK = 200;
/** A drag this long moves at least one step, even when it ends nearer the start height. */
export const SHEET_FLICK = 48;

/** Sheet heights in px for a map area `h` px tall. Always peek < half < full. */
export function sheetHeights(h: number): Record<SheetSnap, number> {
  const full = Math.max(h - SHEET_TOP_GAP, 200);
  const peek = Math.min(SHEET_PEEK, Math.round(full * 0.4));
  const half = Math.min(Math.max(Math.round(h * 0.5), peek + 40), full - 40);
  return { peek, half, full };
}

/** Where a drag lands: the nearest height, or one step on from where it started after a flick. */
export function snapAfterDrag(heights: Record<SheetSnap, number>, start: SheetSnap, endHeight: number): SheetSnap {
  let nearest: SheetSnap = 'peek';
  for (const s of SNAPS) if (Math.abs(heights[s] - endHeight) < Math.abs(heights[nearest] - endHeight)) nearest = s;
  if (nearest !== start) return nearest;
  const moved = endHeight - heights[start];
  const i = SNAPS.indexOf(start);
  if (moved >= SHEET_FLICK && i < SNAPS.length - 1) return SNAPS[i + 1];
  if (moved <= -SHEET_FLICK && i > 0) return SNAPS[i - 1];
  return start;
}

/** A tap (or Enter / Space) on the handle: up to full, then back to peek. */
export const nextSnap = (s: SheetSnap): SheetSnap => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek');
/** Arrow keys on the handle: one step up or down, stopping at the ends. */
export const stepSnap = (s: SheetSnap, dir: 1 | -1): SheetSnap =>
  SNAPS[Math.min(SNAPS.length - 1, Math.max(0, SNAPS.indexOf(s) + dir))];
