// Collapsible section (owner decision B18): a card whose summary shows a title and a short
// preview of what's inside, so a closed section still says something useful.
//
// "Road unrolls" (B83 overdrive, design-language.md §8): opening grows the section, a lane-dash
// line paints itself under the header and the cards inside rise in a short stagger; closing runs a
// quicker reverse. Built on the Web Animations API so every browser gets it. With Animations off in
// Settings (html[data-motion="off"]) the section opens and shuts at once. The native <details>
// keeps keyboard and screen-reader behaviour; a programmatic open (a source link) isn't animated,
// so its scroll lands where it should.
import { useRef, type MouseEvent, type ReactNode } from 'react';
import { reducedMotion } from '../../lib/motion.ts';

interface Props {
  id?: string;
  headingId?: string;
  title: string;
  preview?: ReactNode;
  /** Controlled open state; leave undefined to let the browser handle it. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
  /** Heading level of the title (a section inside a panel uses 3). */
  level?: 2 | 3;
  /** Shown as small pills in the header, e.g. a filter's choices (B86). */
  chips?: string[];
  /** No card around it: a section inside another card (the Cars filter panel, B86). */
  bare?: boolean;
  children: ReactNode;
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // --ease-out
const OPEN_MS = 320;
const SHUT_MS = 220;
const STAGGER_MS = 30;
const MAX_STAGGER = 10;
// What rises in sequence: the body's own blocks, and the cards inside a grid of them.
const RISERS = ':scope > *:not(.readouts):not(.spec-grid), :scope .readouts > *, :scope .spec-grid > *, :scope .selects > *';

/** "a · b · c" previews become small pills; anything else is shown as it is. */
function Preview({ preview }: { preview: ReactNode }) {
  if (typeof preview !== 'string' || !preview.includes(' · ')) return <span className="acc-preview">{preview}</span>;
  return (
    <span className="acc-preview acc-chips">
      {preview.split(' · ').map((p, i) => <span key={i} className="acc-chip">{p}</span>)}
    </span>
  );
}

export function Accordion({ id, headingId, title, preview, open, onToggle, className, level = 2, chips, bare = false, children }: Props) {
  const Heading = level === 3 ? 'h3' : 'h2';
  const box = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const running = useRef<Animation[]>([]);

  const stop = () => { running.current.forEach((a) => a.cancel()); running.current = []; };

  const onSummary = (e: MouseEvent<HTMLElement>) => {
    const d = box.current;
    const b = body.current;
    if (!d || !b || reducedMotion() || typeof b.animate !== 'function') return; // native, instant
    e.preventDefault();
    // A click mid-animation reverses it from where it stands.
    const shutting = d.classList.contains('acc-shutting');
    const opening = d.classList.contains('acc-opening');
    const from = shutting || opening ? b.getBoundingClientRect().height : null;
    stop();
    d.classList.remove('acc-opening', 'acc-shutting');
    if (!d.open || shutting) {
      if (!d.open) d.open = true; // fires toggle → onToggle(true)
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
      running.current = [grow, ...rise];
      grow.finished.then(() => d.classList.remove('acc-opening'), () => d.classList.remove('acc-opening'));
    } else {
      d.classList.add('acc-shutting');
      const h = from ?? b.offsetHeight;
      const shrink = b.animate(
        [{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }],
        { duration: SHUT_MS, easing: EASE },
      );
      running.current = [shrink];
      shrink.finished.then(
        () => { d.classList.remove('acc-shutting'); d.open = false; },
        () => d.classList.remove('acc-shutting'),
      );
    }
  };

  return (
    <details
      ref={box}
      id={id}
      className={[bare ? null : 'card', 'acc', className].filter(Boolean).join(' ')}
      open={open}
      onToggle={onToggle ? (e) => onToggle((e.currentTarget as HTMLDetailsElement).open) : undefined}
    >
      <summary onClick={onSummary}>
        <Heading id={headingId} className="acc-title">{title}</Heading>
        {chips && chips.length > 0
          ? <span className="acc-preview acc-chips">{chips.map((c, i) => <span key={i} className="acc-chip">{c}</span>)}</span>
          : preview && <Preview preview={preview} />}
        <span className="acc-chev" aria-hidden="true" />
      </summary>
      <span className="acc-lane" aria-hidden="true" />
      <div ref={body} className="acc-body">{children}</div>
    </details>
  );
}
