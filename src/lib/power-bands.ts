// Power bands for the charger map (vision.md "Power bands", N1).
// Each band includes its upper edge, so a charger exactly on an edge goes in the
// lower band. Level comes from the data source's classification, never from kW.
// Shared by the data build and the map's filters, so both use the same edges.

export type ChargerLevel = 2 | 3;
export type Plug = 'j1772' | 'ccs1' | 'nacs' | 'chademo';
export const PLUGS: readonly Plug[] = ['ccs1', 'nacs', 'chademo', 'j1772'];

export type BandId =
  | 'l2_le_3_6'
  | 'l2_le_7_2'
  | 'l2_le_11_5'
  | 'l2_gt_11_5'
  | 'l3_le_50'
  | 'l3_le_100'
  | 'l3_le_250'
  | 'l3_gt_250'
  | 'l2_unknown'
  | 'l3_unknown';

/** Upper edges per level, in order; anything above the last edge is the top band. */
const EDGES: Record<ChargerLevel, readonly [number, BandId][]> = {
  2: [
    [3.6, 'l2_le_3_6'],
    [7.2, 'l2_le_7_2'],
    [11.5, 'l2_le_11_5'],
  ],
  3: [
    [50, 'l3_le_50'],
    [100, 'l3_le_100'],
    [250, 'l3_le_250'],
  ],
};
const TOP: Record<ChargerLevel, BandId> = { 2: 'l2_gt_11_5', 3: 'l3_gt_250' };
const UNKNOWN: Record<ChargerLevel, BandId> = { 2: 'l2_unknown', 3: 'l3_unknown' };

/** Bands in display order for one level, "unknown" last. */
export function bandsFor(level: ChargerLevel): BandId[] {
  return [...EDGES[level].map(([, id]) => id), TOP[level], UNKNOWN[level]];
}

/** The band a port of this level and rated power falls in. null/0/negative kW = unknown. */
export function bandOf(level: ChargerLevel, kw: number | null): BandId {
  if (kw == null || !Number.isFinite(kw) || kw <= 0) return UNKNOWN[level];
  for (const [edge, id] of EDGES[level]) if (kw <= edge) return id;
  return TOP[level];
}

export interface PortLike {
  level: ChargerLevel;
  plug: Plug;
  kw: number | null;
}

/** Every band any of a site's ports falls in (a mixed site appears in each). */
export function siteBands(ports: readonly PortLike[]): Set<BandId> {
  return new Set(ports.map((p) => bandOf(p.level, p.kw)));
}

export type TeslaNetwork = 'supercharger' | 'destination' | null;

/** AFDC lists Superchargers as network "Tesla" and destination chargers as "Tesla Destination". */
export function teslaNetwork(network: string | null): TeslaNetwork {
  if (network === 'Tesla') return 'supercharger';
  if (network === 'Tesla Destination') return 'destination';
  return null;
}
