// The speed tag (B54): one to three packed yellow bolts on a dark tag, as on the map's pins and
// in the map key. B89 round 4: shared with the trip's stops and Stations in view, where a
// Level 2 station shows the same tag with the plug drawing instead (no bolts).
import { BOLT, MAP_MARK, PLUG } from '../lib/map-icons.ts';

export default function SpeedIcon({ tier, level2 = false, scale = 1.6 }: { tier: number; level2?: boolean; scale?: number }) {
  const w = level2 ? 11 : 7 + (Math.max(1, tier) - 1) * 4.2 + 4;
  return (
    <svg className="speed-icon" width={w * scale} height={14 * scale} viewBox={`0 0 ${w} 14`} aria-hidden="true">
      <rect width={w} height="14" rx="4" fill={MAP_MARK.tag} stroke={MAP_MARK.tagEdge} strokeWidth="0.6" />
      {level2 ? (
        <g transform="translate(1.5 2) scale(0.42)">
          <path d={PLUG} fill="none" stroke={MAP_MARK.tagPlug} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : Array.from({ length: tier }, (_, i) => (
        <g key={i} transform={`translate(${2 + i * 4.2} 2) scale(${7 / 12} ${10 / 18}) translate(-6 -3)`}>
          <path d={BOLT} fill={MAP_MARK.tagBolt} stroke={MAP_MARK.tag} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
}

/** B89 round 4 (owner): the menu version, for Stations in view and the trip's stops. Bare bolts in
 *  the accent colour (no tag or outline), side by side and as tall as the text; a Level 2 station
 *  gets the plug drawing in the muted colour. Decorative: the kW beside it says the speed. */
export function SpeedMark({ tier, level2 = false, size = 14 }: { tier: number; level2?: boolean; size?: number }) {
  if (level2) {
    return (
      <svg className="speed-mark l2" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d={PLUG} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tier < 1) return null;
  const step = 9; // each bolt is about 8.6 units wide on a 16-unit-high box, a hair apart
  const w = 11 + (tier - 1) * step;
  return (
    <svg className="speed-mark" width={(w / 16) * size} height={size} viewBox={`0 0 ${w} 16`} aria-hidden="true">
      {Array.from({ length: tier }, (_, i) => (
        <g key={i} transform={`translate(${i * step - 2.5} -0.6) scale(0.72)`}>
          <path d={BOLT} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}
