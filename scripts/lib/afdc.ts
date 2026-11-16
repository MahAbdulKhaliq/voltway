// Turns the raw AFDC pull (sources/afdc-ca/stations-raw.json) into the compact,
// source-faithful station list in data/imported/afdc/stations.json.
// Keeps facts only (ports with level, plug, rated kW and count); power ranges and other
// derived values are worked out on the client with src/lib/power-bands.ts.
// Rules: charger-map.md §3, §6, §7 and vision.md "Power bands".

import type { ChargerLevel, Plug } from '../../src/lib/power-bands.ts';

/** The raw fields we read from one AFDC station (the API returns many more). */
export interface RawStation {
  id: number;
  station_name: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  status_code: string | null;
  expected_date: string | null;
  access_code: string | null;
  access_detail_code: string | null;
  access_days_time: string | null;
  restricted_access: boolean | null;
  ev_network: string | null;
  ev_pricing: string | null;
  ev_pricing_fr?: string | null;
  updated_at: string | null;
  date_last_confirmed: string | null;
  ev_charging_units:
    | {
        charging_level: string | null;
        connectors: Record<string, { power_kw: number | null; port_count: number | null }> | null;
      }[]
    | null;
}

export interface Port {
  level: ChargerLevel;
  plug: Plug;
  /** Rated power from the source; null when the source has none ("Unknown power"). */
  kw: number | null;
  count: number;
}

export interface Station {
  id: number;
  name: string;
  street: string | null;
  city: string | null;
  province: string | null;
  postal: string | null;
  lat: number;
  lon: number;
  network: string | null;
  /** E = available, T = temporarily unavailable (planned stations are dropped). */
  status: 'E' | 'T';
  expected_date: string | null;
  restricted: boolean;
  access_detail: string | null;
  hours: string | null;
  pricing: string | null;
  pricing_fr: string | null;
  updated: string | null;
  confirmed: string | null;
  ports: Port[];
}

export type DropReason = 'private' | 'planned' | 'no_location' | 'no_l2_l3_ports';

export interface NormalizeResult {
  stations: Station[];
  dropped: Record<DropReason, number>;
  /** Ports with a connector type outside the four plugs (e.g. NEMA outlets), ignored. */
  ignored_ports: Record<string, number>;
}

const PLUG_OF: Record<string, Plug> = {
  J1772: 'j1772',
  J1772COMBO: 'ccs1',
  TESLA: 'nacs',
  CHADEMO: 'chademo',
};

/** The source's own level classification: "2" → Level 2, "dc_fast" → Level 3. Level 1 is out of scope. */
export function levelOf(chargingLevel: string | null): ChargerLevel | null {
  if (chargingLevel === '2') return 2;
  if (chargingLevel === 'dc_fast') return 3;
  return null;
}

const text = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};
const day = (v: string | null): string | null => (v ? v.slice(0, 10) : null);

/** Merges identical {level, plug, kW} lines across charging units and sorts them for stable output. */
function portsOf(raw: RawStation, ignored: Record<string, number>): Port[] {
  const merged = new Map<string, Port>();
  for (const unit of raw.ev_charging_units ?? []) {
    const level = levelOf(unit.charging_level);
    for (const [type, c] of Object.entries(unit.connectors ?? {})) {
      const count = c.port_count ?? 0;
      if (count <= 0) continue; // AFDC lists every connector type, most with 0 ports
      const plug = PLUG_OF[type];
      if (level === null) continue; // Level 1 port
      if (!plug) {
        ignored[type] = (ignored[type] ?? 0) + count;
        continue;
      }
      const kw = c.power_kw != null && c.power_kw > 0 ? c.power_kw : null;
      const key = `${level}|${plug}|${kw ?? ''}`;
      const prev = merged.get(key);
      if (prev) prev.count += count;
      else merged.set(key, { level, plug, kw, count });
    }
  }
  return [...merged.values()].sort(
    (a, b) => b.level - a.level || a.plug.localeCompare(b.plug) || (b.kw ?? -1) - (a.kw ?? -1),
  );
}

export function normalizeStations(raw: readonly RawStation[]): NormalizeResult {
  const dropped: Record<DropReason, number> = { private: 0, planned: 0, no_location: 0, no_l2_l3_ports: 0 };
  const ignored_ports: Record<string, number> = {};
  const stations: Station[] = [];
  for (const r of raw) {
    if (r.access_code !== 'public') {
      dropped.private++;
      continue;
    }
    if (r.status_code !== 'E' && r.status_code !== 'T') {
      dropped.planned++;
      continue;
    }
    if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number') {
      dropped.no_location++;
      continue;
    }
    const ports = portsOf(r, ignored_ports);
    if (ports.length === 0) {
      dropped.no_l2_l3_ports++;
      continue;
    }
    stations.push({
      id: r.id,
      name: text(r.station_name) ?? `#${r.id}`,
      street: text(r.street_address),
      city: text(r.city),
      province: text(r.state),
      postal: text(r.zip),
      lat: r.latitude,
      lon: r.longitude,
      network: text(r.ev_network),
      status: r.status_code,
      expected_date: r.status_code === 'T' ? day(r.expected_date) : null,
      restricted: r.restricted_access === true,
      access_detail: text(r.access_detail_code),
      hours: text(r.access_days_time),
      pricing: text(r.ev_pricing),
      pricing_fr: text(r.ev_pricing_fr),
      updated: day(r.updated_at),
      confirmed: day(r.date_last_confirmed),
      ports,
    });
  }
  stations.sort((a, b) => a.id - b.id);
  return { stations, dropped, ignored_ports };
}

export interface StationsFile {
  source: 'afdc-ca';
  source_id: string;
  fetched_at: string;
  raw_sha256: string;
  raw_count: number;
  dropped: Record<DropReason, number>;
  ignored_ports: Record<string, number>;
  stations: Station[];
}

/** Pretty header, then one station per line, so daily diffs show only changed stations. */
export function serializeStationsFile(f: StationsFile): string {
  const { stations, ...head } = f;
  const headJson = JSON.stringify(head, null, 2).replace(/\n}$/, '');
  const body = stations.map((s) => '    ' + JSON.stringify(s)).join(',\n');
  return `${headJson},\n  "stations": [\n${body}\n  ]\n}\n`;
}
