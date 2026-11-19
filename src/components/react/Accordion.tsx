// Collapsible section (owner decision B18): a card whose summary shows a title and a short
// preview of what's inside, so a closed section still says something useful.
//
// "Road unrolls" (B83 overdrive, design-language.md §8): the open/close animation lives in
// lib/road-unroll.ts (B88), shared with the static Astro sections. Built on the Web Animations API
// so every browser gets it. With Animations off in Settings (html[data-motion="off"]) the section
// opens and shuts at once. The native <details> keeps keyboard and screen-reader behaviour; a
// programmatic open (a source link) isn't animated, so its scroll lands where it should.
import { useRef, type MouseEvent, type ReactNode } from 'react';
import { unroll } from '../../lib/road-unroll.ts';

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

  const onSummary = (e: MouseEvent<HTMLElement>) => {
    if (box.current && body.current) unroll(box.current, body.current, e.nativeEvent);
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
