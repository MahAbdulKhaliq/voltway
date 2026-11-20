// The map panel as a bottom sheet on phones (B59): a handle you drag (touch or mouse) or tap /
// use the keyboard on, three heights (src/lib/sheet.ts), and the sheet's height published as
// --sheet-px on the map so its own controls stay above it. Wider screens: no sheet, no styles.

import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type FormEvent, type KeyboardEvent, type PointerEvent, type TouchEvent, type WheelEvent } from 'react';
import { nextSnap, sheetHeights, SHEET_MEDIA, snapAfterDrag, stepSnap, type SheetSnap } from '../lib/sheet.ts';

/** onUserSnap: the visitor moved the sheet (drag, tap or arrow keys) to this height. */
export function useMapSheet(onUserSnap?: (s: SheetSnap) => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(false);
  const [rootH, setRootH] = useState(0);
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [dragH, setDragH] = useState<number | null>(null);
  const [frozenH, setFrozenH] = useState<number | null>(null); // B133, below
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
  // A move the visitor makes (drag, tap, keys) ends the B133 hold on the height.
  const userSnap = (s: SheetSnap) => { setFrozenH(null); setSnap(s); onUserSnap?.(s); };

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
      userSnap(snapAfterDrag(heights, from, end));
    }
    setDragH(null);
    // Keep the click that follows a drag from stepping the sheet again.
    setTimeout(() => { drag.current = null; }, 0);
  };
  const onClick = () => {
    if (drag.current?.moved) return;
    userSnap(nextSnap(snap));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      userSnap(stepSnap(snap, e.key === 'ArrowUp' ? 1 : -1));
    }
  };
  // B133 (owner 2026-11-20): typing in a field no longer moves the sheet (since B89 it rose to full).
  // While a text field has focus the sheet keeps the height it had, the suggestions scroll inside it,
  // and the field is scrolled to the top of the sheet's body so its suggestions show under it.
  const isText = (el: EventTarget | null) => el instanceof HTMLElement && el.matches('input:not([type=checkbox]):not([type=range]):not([type=radio]), textarea');
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (!phone || !isText(e.target) || !panelRef.current) return;
    setFrozenH((h) => h ?? Math.round(panelRef.current!.getBoundingClientRect().height));
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!isText(e.relatedTarget)) setFrozenH(null);
  };
  const onInput = (e: FormEvent<HTMLDivElement>) => {
    if (!phone || !isText(e.target)) return;
    const field = (e.target as HTMLElement).closest<HTMLElement>('.tp-field') ?? (e.target as HTMLElement);
    const body = field.closest<HTMLElement>('.route-body');
    if (!body) return;
    requestAnimationFrame(() => {
      body.scrollTop += field.getBoundingClientRect().top - body.getBoundingClientRect().top - 8;
    });
  };

  // B89 round 4 (owner): at peek the sheet's content doesn't scroll; a swipe up on it (or a wheel
  // scroll down) raises the sheet half way instead, and from there it scrolls as usual.
  const swipe = useRef<number | null>(null);
  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    swipe.current = phone && snap === 'peek' && !(e.target as HTMLElement).closest('.sheet-handle') ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const y0 = swipe.current;
    if (y0 === null) return;
    if (y0 - e.touches[0].clientY > 24) { swipe.current = null; userSnap('half'); }
  };
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (phone && snap === 'peek' && e.deltaY > 8) userSnap('half');
  };

  const panelStyle: CSSProperties | undefined = phone
    ? dragH === null && frozenH !== null
      ? { maxHeight: frozenH, height: frozenH }
      : { maxHeight: dragH ?? heights[snap], ...(dragH !== null ? { height: dragH, transition: 'none' } : {}) }
    : undefined;

  return {
    phone, snap, setSnap, heightFor,
    /** The handle is being dragged (the sheet follows the finger). */
    dragging: dragH !== null, rootRef, panelRef, panelStyle,
    panelProps: { onTouchStart, onTouchMove, onWheel, onFocus, onBlur, onInput },
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClick, onKeyDown },
  };
}
