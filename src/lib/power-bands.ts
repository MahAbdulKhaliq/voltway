// Power filtering for the charger map (charger-map.md §4, B35): one two-handle kW slider per
// level. The handles snap to fixed stops; a range is a pair of stop indices [lo, hi] with lo < hi.
// A port matches when stops[lo] ≤ kW ≤ stops[hi] (both ends included); the last stop is "Max",
// meaning no upper limit. Ports with no kW figure match only while the range is the full one.
// Level comes from the data source's classification, never from kW.

export type ChargerLevel = 2 | 3;
export type Plug = 'j1772' | 'ccs1' | 'nacs' | 'chademo';
export const PLUGS: readonly Plug[] = ['ccs1', 'nacs', 'chademo', 'j1772'];

/** Slider stops in kW. They sit on the vision.md band edges (plus 150 and 350 for Level 3). */
export const POWER_STOPS: Record<ChargerLevel, readonly number[]> = {
  2: [0, 3.6, 7.2, 11.5, 19.2, Number.POSITIVE_INFINITY],
  3: [0, 50, 100, 150, 250, 350, Number.POSITIVE_INFINITY],
};

/** Indices into POWER_STOPS[level]: [low handle, high handle], low < high. */
export type PowerRange = readonly [number, number];

export const fullRange = (level: ChargerLevel): PowerRange => [0, POWER_STOPS[level].length - 1];

export function isFullRange(level: ChargerLevel, r: PowerRange): boolean {
  return r[0] === 0 && r[1] === POWER_STOPS[level].length - 1;
}

/** A usable range for this level: two integers in bounds, low below high. */
export function isValidRange(level: ChargerLevel, r: unknown): r is PowerRange {
  const last = POWER_STOPS[level].length - 1;
  return (
    Array.isArray(r) &&
    r.length === 2 &&
    r.every((x) => Number.isInteger(x)) &&
    r[0] >= 0 &&
    r[1] <= last &&
    r[0] < r[1]
  );
}

/** Whether a port of this level and rated power passes the range. null/0/negative kW = unknown. */
export function inPowerRange(level: ChargerLevel, kw: number | null, r: PowerRange): boolean {
  if (kw == null || !Number.isFinite(kw) || kw <= 0) return isFullRange(level, r);
  const s = POWER_STOPS[level];
  return kw >= s[r[0]] && kw <= s[r[1]];
}

/** How the range reads in words: which message, and the kW figures it needs. */
export type RangeWords =
  | { key: 'any' }
  | { key: 'upTo'; max: number }
  | { key: 'from'; min: number }
  | { key: 'between'; min: number; max: number };

export function rangeWords(level: ChargerLevel, r: PowerRange): RangeWords {
  const s = POWER_STOPS[level];
  const min = s[r[0]];
  const max = s[r[1]];
  const noMax = !Number.isFinite(max);
  if (min === 0 && noMax) return { key: 'any' };
  if (min === 0) return { key: 'upTo', max };
  if (noMax) return { key: 'from', min };
  return { key: 'between', min, max };
}

export type TeslaNetwork = 'supercharger' | 'destination' | null;

/** AFDC lists Superchargers as network "Tesla" and destination chargers as "Tesla Destination". */
export function teslaNetwork(network: string | null): TeslaNetwork {
  if (network === 'Tesla') return 'supercharger';
  if (network === 'Tesla Destination') return 'destination';
  return null;
}
