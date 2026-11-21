// A figure fold (B137/B138, design-language.md §12): one row with a plain-language line and the
// round chevron; opening grows the body with the "Road unrolls" motion (lib/road-unroll.ts).
// `phoneOnly`: on wider screens the row hides and the body always shows (CSS, so no hydration flash).
import { useId, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { reducedMotion } from '../../lib/motion.ts';
import { EASE, MAX_STAGGER, OPEN_MS, RISERS, SHUT_MS, STAGGER_MS } from '../../lib/road-unroll.ts';

// Fold motion: the box's animation state is a data attribute, which React leaves alone.
const foldRuns = new WeakMap<HTMLElement, Animation[]>();

/** Toggles a fold: grows `b` open (blocks rise in) or shrinks it shut, then reports the new state. */
export function fold(box: HTMLElement, b: HTMLElement, isOpen: boolean, setOpen: (open: boolean) => void): void {
  const anim = box.dataset.anim;
  const from = anim ? b.getBoundingClientRect().height : null;
  (foldRuns.get(box) ?? []).forEach((a) => a.cancel());
  delete box.dataset.anim;
  const wantOpen = anim === 'shutting' || (!anim && !isOpen);
  if (reducedMotion() || typeof b.animate !== 'function') { setOpen(wantOpen); return; }
  if (wantOpen) {
    if (!isOpen) flushSync(() => setOpen(true));
    box.dataset.anim = 'opening';
    const h = b.scrollHeight;
    const grow = b.animate([{ height: `${from ?? 0}px`, opacity: from ? 1 : 0 }, { height: `${h}px`, opacity: 1 }], { duration: OPEN_MS, easing: EASE });
    const rise = from ? [] : [...b.querySelectorAll<HTMLElement>(RISERS)].slice(0, MAX_STAGGER).map((el, i) =>
      el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 60 + i * STAGGER_MS, easing: EASE, fill: 'backwards' }));
    foldRuns.set(box, [grow, ...rise]);
    grow.finished.then(() => { if (box.dataset.anim === 'opening') delete box.dataset.anim; }, () => {});
  } else {
    box.dataset.anim = 'shutting';
    const shrink = b.animate([{ height: `${from ?? b.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: SHUT_MS, easing: EASE });
    foldRuns.set(box, [shrink]);
    shrink.finished.then(() => { if (box.dataset.anim === 'shutting') { delete box.dataset.anim; setOpen(false); } }, () => {});
  }
}

/**
 * Animates an element's height across a React change (a stacked table row opening its figures,
 * B138): measures, applies the change synchronously, and grows or shrinks from the old height.
 * New blocks matching `rise` fade up in sequence.
 */
export function resizeAcross(el: HTMLElement, change: () => void, rise?: string): void {
  if (reducedMotion() || typeof el.animate !== 'function') { change(); return; }
  (foldRuns.get(el) ?? []).forEach((a) => a.cancel());
  const h0 = el.getBoundingClientRect().height;
  flushSync(change);
  const h1 = el.getBoundingClientRect().height;
  if (Math.abs(h1 - h0) < 1) return;
  const prev = el.style.overflow;
  el.style.overflow = 'hidden';
  const grow = el.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: h1 > h0 ? OPEN_MS : SHUT_MS, easing: EASE });
  const risers = rise && h1 > h0 ? [...el.querySelectorAll<HTMLElement>(rise)].slice(0, MAX_STAGGER).map((x, i) =>
    x.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 40 + i * STAGGER_MS, easing: EASE, fill: 'backwards' })) : [];
  foldRuns.set(el, [grow, ...risers]);
  const done = () => { el.style.overflow = prev; };
  grow.finished.then(done, done);
}

interface Props {
  /** What the fold holds, always shown. */
  title: string;
  /** A small muted line while closed: the figures themselves, kept up to date by the caller. */
  summary?: string;
  phoneOnly?: boolean;
  className?: string;
  children: ReactNode;
}

export function Fold({ title, summary, phoneOnly = false, className, children }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  return (
    <div ref={box} className={['figfold', phoneOnly ? 'figfold-phone' : null, open ? 'open' : null, className].filter(Boolean).join(' ')}>
      <button type="button" className="figfold-row" aria-expanded={open} aria-controls={id}
        onClick={() => box.current && body.current && fold(box.current, body.current, open, setOpen)}>
        <span className="figfold-text">
          <span className="figfold-title">{title}</span>
          {summary && <span className="figfold-sum">{summary}</span>}
        </span>
        <span className="acc-chev" aria-hidden="true" />
      </button>
      <span className="acc-lane" aria-hidden="true" />
      <div ref={body} id={id} className="figfold-body">{children}</div>
    </div>
  );
}
