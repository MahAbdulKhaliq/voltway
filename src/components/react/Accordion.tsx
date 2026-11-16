// Collapsible section (owner decision B18): a card whose summary shows a title and a short
// preview of what's inside, so a closed section still says something useful.
import type { ReactNode } from 'react';

interface Props {
  id?: string;
  headingId?: string;
  title: string;
  preview?: ReactNode;
  /** Controlled open state; leave undefined to let the browser handle it. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}

export function Accordion({ id, headingId, title, preview, open, onToggle, className, children }: Props) {
  return (
    <details
      id={id}
      className={['card', 'acc', className].filter(Boolean).join(' ')}
      open={open}
      onToggle={onToggle ? (e) => onToggle((e.currentTarget as HTMLDetailsElement).open) : undefined}
    >
      <summary>
        <h2 id={headingId} className="acc-title">{title}</h2>
        {preview && <span className="acc-preview">{preview}</span>}
      </summary>
      <div className="acc-body">{children}</div>
    </details>
  );
}
