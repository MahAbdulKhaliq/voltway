// Scrolling text (owner, B70): where a line is kept to one row (phones: Stations in view and a
// station's name and address) and the text is longer than its box, it slides slowly to the end,
// waits, fades out and comes back at the start. Text that fits, or wraps (desktop), stays still.
// With Animations off it ends in "…" instead (global.css).

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** Room the fade at each edge takes, so the last letters still come fully into view. */
const EDGE = 14;

export default function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  const outer = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const over = i.getBoundingClientRect().width - o.clientWidth;
      setShift(over > 1 ? Math.ceil(over) + EDGE : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    return () => ro.disconnect();
  }, [children]);
  const style = shift
    ? ({ '--shift': `-${shift}px`, '--dur': `${(Math.max(5, 4 + shift / 22)).toFixed(1)}s` } as CSSProperties)
    : undefined;
  return (
    <span ref={outer} className={`marquee${shift ? ' moving' : ''}${className ? ` ${className}` : ''}`} style={style}>
      <span ref={inner} className="marquee-text">{children}</span>
    </span>
  );
}
