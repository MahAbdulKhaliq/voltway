// A plug's face as a small line drawing (B54), in the text colour: the map's plug filters and,
// since B89, the plugs a trip uses in the trip planner's car card.
import { PLUG_SHAPES } from '../lib/map-icons.ts';
import type { Plug } from '../lib/power-bands.ts';

export default function PlugIcon({ plug, size = 18 }: { plug: Plug; size?: number }) {
  const s = PLUG_SHAPES[plug];
  return (
    <svg className="plug-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={s.outline} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {s.dots.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" />)}
    </svg>
  );
}
