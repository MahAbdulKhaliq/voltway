// The map panel as a bottom sheet on phones (B59): a handle you drag (touch or mouse) or tap /
// use the keyboard on, three heights (src/lib/sheet.ts), and the sheet's height published as
// --sheet-px on the map so its own controls stay above it. Wider screens: no sheet, no styles.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type SyntheticEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { nextSnap, sheetHeights, SHEET_MEDIA, snapAfterDrag, stepSnap, type SheetSnap } from '../lib/sheet.ts';

export function useMapSheet() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(false);
  const [rootH, setRootH] = useState(0);
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [dragH, setDragH] = useState<number | null>(null);
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null);

  useEffect(() => {
    const mq = matchMedia(SHEET_MEDIA);
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // The map area's height sets the snap heights; the panel's real height goes to --sheet-px.
  useEffect(() => {
    const root = rootRef.current, panel = panelRef.current;
    if (!root || !panel) return;
    const ro = new ResizeObserver(() => {
      setRootH(root.clientHeight);
      root.style.setProperty('--sheet-px', phone ? `${Math.round(panel.getBoundingClientRect().height)}px` : '0px');
    });
    ro.observe(root);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [phone]);

  const heights = sheetHeights(rootH || (typeof window !== 'undefined' ? window.innerHeight : 800));
  const heightFor = (s: SheetSnap) => heights[s];

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, h: panel.getBoundingClientRect().height, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.y - e.clientY;
    if (!d.moved && Math.abs(dy) < 6) return;
    d.moved = true;
    setDragH(Math.min(heights.full, Math.max(heights.peek - 40, d.h + dy)));
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (d.moved) {
      const end = Math.min(heights.full, Math.max(0, d.h + (d.y - e.clientY)));
      // A drag from a short sheet starts from the height it showed, not from its snap.
      const from: SheetSnap = Math.abs(d.h - heights[snap]) < 24 ? snap : snapAfterDrag(heights, 'peek', d.h);
      setSnap(snapAfterDrag(heights, from, end));
    }
    setDragH(null);
    // Keep the click that follows a drag from stepping the sheet again.
    setTimeout(() => { drag.current = null; }, 0);
  };
  const onClick = () => {
    if (drag.current?.moved) return;
    setSnap((s) => nextSnap(s));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSnap((s) => stepSnap(s, e.key === 'ArrowUp' ? 1 : -1));
    }
  };
  // Tapping or typing in a field (place search, percentages) opens the sheet fully, above the
  // keyboard. Focus the page moves itself (closing a trip) leaves the sheet as it is.
  const toFull = useCallback((e: SyntheticEvent<HTMLDivElement>) => {
    if (!phone) return;
    const el = e.target as HTMLElement;
    if (el.matches('input:not([type=checkbox]):not([type=range]), textarea')) setSnap('full');
  }, [phone]);

  const panelStyle: CSSProperties | undefined = phone
    ? { maxHeight: dragH ?? heights[snap], ...(dragH !== null ? { height: dragH, transition: 'none' } : {}) }
    : undefined;

  return {
    phone, snap, setSnap, heightFor, rootRef, panelRef, panelStyle,
    panelProps: { onPointerDownCapture: toFull, onInput: toFull },
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClick, onKeyDown },
  };
}
