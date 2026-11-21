// "Live reflow" (B86, design-language.md §10): when a list re-renders, the items that stay glide from
// where they were to where they are now (FLIP), new items rise in and removed ones fade out where they
// stood. Only items near the screen animate, so a long list stays cheap. With Animations off
// (html[data-motion="off"]) nothing animates.
//
// Items carry data-flip="<id>". Removed items fade out as copies in `ghosts`, an empty layer that
// React never renders into, positioned over the list.

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { reducedMotion } from '../../lib/motion.ts';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // --ease-out
const MOVE_MS = 440;
const ENTER_MS = 320;
const EXIT_MS = 200;
const STAGGER_MS = 24;
const MAX_STAGGER = 10;
const MAX_ITEMS = 400;

interface Spot { x: number; y: number; w: number; h: number; el: HTMLElement }

export function useFlip(list: RefObject<HTMLElement | null>, ghosts: RefObject<HTMLElement | null> | null, key: string) {
  const prev = useRef<Map<string, Spot> | null>(null);
  // Positions change without a re-render too (a table row opening its figures, B138): call this
  // afterwards so the next reflow starts from where the items really are.
  const resnap = () => {
    const box = list.current;
    if (!box || !prev.current) return;
    const boxRect = box.getBoundingClientRect();
    const now = new Map<string, Spot>();
    for (const el of box.querySelectorAll<HTMLElement>(':scope > [data-flip]')) {
      const r = el.getBoundingClientRect();
      now.set(el.dataset.flip!, { x: r.left - boxRect.left, y: r.top - boxRect.top, w: r.width, h: r.height, el });
    }
    prev.current = now;
  };

  useLayoutEffect(() => {
    const box = list.current;
    if (!box) { prev.current = null; return; }
    const items = [...box.querySelectorAll<HTMLElement>(':scope > [data-flip]')];
    const boxRect = box.getBoundingClientRect();
    // Where each item is drawn right now (mid-animation included), then where it really sits.
    const seen = new Map<string, DOMRect>();
    for (const el of items) {
      if (el.getAnimations().length) {
        seen.set(el.dataset.flip!, el.getBoundingClientRect());
        el.getAnimations().forEach((a) => a.cancel());
      }
    }
    const now = new Map<string, Spot>();
    for (const el of items) {
      const r = el.getBoundingClientRect();
      now.set(el.dataset.flip!, { x: r.left - boxRect.left, y: r.top - boxRect.top, w: r.width, h: r.height, el });
    }
    const before = prev.current;
    prev.current = now;
    if (!before || reducedMotion() || items.length > MAX_ITEMS || typeof box.animate !== 'function') return;

    const vh = window.innerHeight;
    const visible = (y: number, h: number) => boxRect.top + y + h > -80 && boxRect.top + y < vh + 80;
    let entering = 0;
    for (const [id, spot] of now) {
      const old = before.get(id);
      const drawn = seen.get(id);
      const fromX = drawn ? drawn.left - boxRect.left : old?.x;
      const fromY = drawn ? drawn.top - boxRect.top : old?.y;
      if (fromX === undefined || fromY === undefined) {
        if (!visible(spot.y, spot.h)) continue;
        spot.el.animate(
          [{ opacity: 0, transform: 'translateY(10px) scale(0.98)' }, { opacity: 1, transform: 'none' }],
          { duration: ENTER_MS, delay: Math.min(entering++, MAX_STAGGER) * STAGGER_MS + 60, easing: EASE, fill: 'backwards' },
        );
        continue;
      }
      const dx = fromX - spot.x;
      const dy = fromY - spot.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      if (!visible(spot.y, spot.h) && !visible(fromY, spot.h)) continue;
      spot.el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: MOVE_MS, easing: EASE });
    }

    // Removed items fade out where they stood, as inert copies in the ghost layer.
    const layer = ghosts?.current;
    if (!layer) return;
    for (const [id, old] of before) {
      if (now.has(id) || !visible(old.y, old.h)) continue;
      const copy = old.el.cloneNode(true) as HTMLElement;
      copy.removeAttribute('data-flip');
      copy.setAttribute('inert', '');
      copy.setAttribute('aria-hidden', 'true');
      Object.assign(copy.style, { position: 'absolute', left: `${old.x}px`, top: `${old.y}px`, width: `${old.w}px`, height: `${old.h}px`, margin: '0', pointerEvents: 'none' });
      layer.appendChild(copy);
      const a = copy.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.96)' }], { duration: EXIT_MS, easing: EASE, fill: 'forwards' });
      const drop = () => copy.remove();
      a.finished.then(drop, drop);
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return resnap;
}
