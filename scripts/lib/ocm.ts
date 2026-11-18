// Turns the raw Open Charge Map pull (sources/ocm-ca/poi-raw.json, compact form) into the same
// station shape as AFDC (scripts/lib/afdc.ts), plus who provided each record and when OCM last
// verified it. Rules: docs/plan/DESIGN-6.md P2 (owner decision B77, 2026-11-18).
// Duplicates against AFDC are removed later, at map build time (scripts/lib/ocm-merge.ts), so they
// always follow the current AFDC data.

import type { ChargerLevel, Plug } from '../../src/lib/power-bands.ts';
import type { Port, Station } from './afdc.ts';
import { OCM_ID_OFFSET, OCM_PROVIDERS } from '../../src/lib/map-data.ts';
import { inCountryBox, type Country } from './countries.ts';

/** OCM map ids start here, so they never collide with AFDC ids (max ~473,000 in 2026). */
export { OCM_ID_OFFSET, OCM_PROVIDERS };


/** The open-licensed data providers we take (DESIGN-6 P2). 2 = OCM's copies of AFDC: never fetched. */
export const OCM_PROVIDER_IDS = Object.keys(OCM_PROVIDERS).map(Number);

/** The raw fields we read from one compact OCM POI. */
export interface RawPoi {
  ID: number;
  DataProviderID?: number | null;
  OperatorID?: number | null;
  UsageTypeID?: number | null;
  UsageCost?: string | null;
  StatusTypeID?: number | null;
  SubmissionStatusTypeID?: number | null;
  DateLastVerified?: string | null;
  DateLastStatusUpdate?: string | null;
  AddressInfo?: {
    Title?: string | null;
    AddressLine1?: string | null;
    Town?: string | null;
    StateOrProvince?: string | null;
    Postcode?: string | null;
    Latitude?: number | null;
    Longitude?: number | null;
    AccessComments?: string | null;
  } | null;
  Connections?: {
    ConnectionTypeID?: number | null;
    StatusTypeID?: number | null;
    LevelID?: number | null;
    PowerKW?: number | null;
    Quantity?: number | null;
  }[] | null;
}

export interface OcmStation extends Station {
  /** OCM data provider id (a key of OCM_PROVIDERS). */
  provider: number;
  /** Date OCM last verified the record (YYYY-MM-DD), if any. */
  verified: string | null;
}

/**
 * `no_port_data`: no connection listed, or only OCM's "unknown" type: missing data, which the checks count.
 * `no_l2_l3_ports`: connections are listed but none is Level 2/3 on our four plugs (Level 1 or household
 * outlets only, Type 2…): a real station we leave out, not missing data (B78, 7.4).
 */
export type OcmDropReason = 'provider' | 'unpublished' | 'not_operational' | 'private' | 'no_location' | 'no_port_data' | 'no_l2_l3_ports';

const PLUG_OF: Record<number, Plug> = { 1: 'j1772', 32: 'ccs1', 2: 'chademo', 27: 'nacs', 30: 'nacs' };
/** Published: imported and published (100) or submission published (200). */
const PUBLISHED = new Set([100, 200]);
/** Not operational (100), planned (150), removed (200), duplicate listing (210). */
const GONE = new Set([100, 150, 200, 210]);
const TEMPORARILY_UNAVAILABLE = 30;
/** Private for staff/visitors (6), private restricted (2), privately owned notice required (3). */
const PRIVATE = new Set([2, 3, 6]);
/**
 * Public but restricted: notice required (7) only (owner, 2026-11-18, after QA). Membership required (4) is a network
 * anyone can join (Ivy, FLO, ChargePoint…), which AFDC doesn't mark restricted either; pay at location (5) isn't one.
 */
const RESTRICTED = new Set([7]);
const DC_KW = 40;

/** Our network names for OCM operator ids (so the Network filter shows one entry per network). */
const NETWORK_OF: Record<string, string | null> = {
  'flo': 'FLO', 'ChargePoint': 'ChargePoint Network', 'Circuit Electrique': 'Circuit électrique', 'BC Hydro': 'BCHYDRO',
  'IVY': 'IVY', 'Shell Recharge Solutions (US)': 'SHELL_RECHARGE', 'Electrify Canada': 'Electrify Canada', 'EV Connect': 'EV Connect',
  'Jule': 'JULE', 'NBP eCharge Network': 'eCharge Network', 'SWTCH - Charge Everywhere': 'SWTCH', 'On the Run (CA)': 'ON_THE_RUN_EV',
  'Lakeland Solutions': 'LAKELAND_EV', 'Circle K': 'COUCHE_TARD', 'Hwisel EV': 'Hwisel', 'OpConnect': 'OpConnect',
  '7-Charge (7-Eleven)': '7CHARGE', 'Chargelab': 'CHARGELAB', 'EVStart (CA)': 'EVSTART', 'Noodoe EV': 'NOODOE',
  'Sun Country Highway': 'Sun Country Highway', '(Unknown Operator)': null, '(Business Owner at Location)': null,
};

/**
 * Level (DESIGN-6 P2, owner-approved 2026-11-18 after the audit): the plug decides where it can.
 * CCS1 and CHAdeMO are always DC, so Level 3; J1772 is never DC, so Level 2 (Level 1 dropped).
 * Only NACS carries both: Level 3 when OCM says level 3 or the port is 40 kW and up, else Level 2.
 */
/** No car charger in either country is rated above this; a bigger figure is treated as unknown. */
export const MAX_KW = 1000;

export function levelOf(levelId: number | null | undefined, plug: Plug, kw: number | null): ChargerLevel | null {
  if (plug === 'ccs1' || plug === 'chademo') return 3;
  if (levelId === 1) return null;
  if (plug === 'j1772') return 2;
  return levelId === 3 || (kw !== null && kw >= DC_KW) ? 3 : 2;
}

const PROVINCES: Record<string, string> = {
  AB: 'AB', ALBERTA: 'AB', BC: 'BC', 'B.C.': 'BC', 'BRITISH COLUMBIA': 'BC', 'COLOMBIE-BRITANNIQUE': 'BC', MB: 'MB', MANITOBA: 'MB',
  NB: 'NB', 'NEW BRUNSWICK': 'NB', 'NEW-BRUNSWICK': 'NB', 'NOUVEAU-BRUNSWICK': 'NB', NL: 'NL', NEWFOUNDLAND: 'NL', 'NEWFOUNDLAND AND LABRADOR': 'NL',
  NS: 'NS', 'NOVA SCOTIA': 'NS', 'NOUVELLE-ÉCOSSE': 'NS', NT: 'NT', 'NORTHWEST TERRITORIES': 'NT', NU: 'NU', NUNAVUT: 'NU',
  ON: 'ON', ONTARIO: 'ON', PE: 'PE', PEI: 'PE', 'PRINCE EDWARD ISLAND': 'PE', QC: 'QC', QUEBEC: 'QC', QUÉBEC: 'QC', SK: 'SK', SASKATCHEWAN: 'SK',
  YT: 'YT', YUKON: 'YT',
};
/** US states, DC and territories (B78): OCM's free text ("Texas", "tx", "D.C.") → two-letter code. */
const STATES: Record<string, string> = {
  AL: 'AL', 'ALABAMA': 'AL', AK: 'AK', 'ALASKA': 'AK', AZ: 'AZ', 'ARIZONA': 'AZ', AR: 'AR', 'ARKANSAS': 'AR',
  CA: 'CA', 'CALIFORNIA': 'CA', CO: 'CO', 'COLORADO': 'CO', CT: 'CT', 'CONNECTICUT': 'CT', DE: 'DE', 'DELAWARE': 'DE',
  DC: 'DC', 'DISTRICT OF COLUMBIA': 'DC', FL: 'FL', 'FLORIDA': 'FL', GA: 'GA', 'GEORGIA': 'GA',
  HI: 'HI', 'HAWAII': 'HI', ID: 'ID', 'IDAHO': 'ID', IL: 'IL', 'ILLINOIS': 'IL', IN: 'IN', 'INDIANA': 'IN',
  IA: 'IA', 'IOWA': 'IA', KS: 'KS', 'KANSAS': 'KS', KY: 'KY', 'KENTUCKY': 'KY', LA: 'LA', 'LOUISIANA': 'LA',
  ME: 'ME', 'MAINE': 'ME', MD: 'MD', 'MARYLAND': 'MD', MA: 'MA', 'MASSACHUSETTS': 'MA', MI: 'MI', 'MICHIGAN': 'MI',
  MN: 'MN', 'MINNESOTA': 'MN', MS: 'MS', 'MISSISSIPPI': 'MS', MO: 'MO', 'MISSOURI': 'MO', MT: 'MT', 'MONTANA': 'MT',
  NE: 'NE', 'NEBRASKA': 'NE', NV: 'NV', 'NEVADA': 'NV', NH: 'NH', 'NEW HAMPSHIRE': 'NH', NJ: 'NJ', 'NEW JERSEY': 'NJ',
  NM: 'NM', 'NEW MEXICO': 'NM', NY: 'NY', 'NEW YORK': 'NY', NC: 'NC', 'NORTH CAROLINA': 'NC',
  ND: 'ND', 'NORTH DAKOTA': 'ND', OH: 'OH', 'OHIO': 'OH', OK: 'OK', 'OKLAHOMA': 'OK', OR: 'OR', 'OREGON': 'OR',
  PA: 'PA', 'PENNSYLVANIA': 'PA', RI: 'RI', 'RHODE ISLAND': 'RI', SC: 'SC', 'SOUTH CAROLINA': 'SC',
  SD: 'SD', 'SOUTH DAKOTA': 'SD', TN: 'TN', 'TENNESSEE': 'TN', TX: 'TX', 'TEXAS': 'TX', UT: 'UT', 'UTAH': 'UT',
  VT: 'VT', 'VERMONT': 'VT', VA: 'VA', 'VIRGINIA': 'VA', WA: 'WA', 'WASHINGTON': 'WA', WV: 'WV', 'WEST VIRGINIA': 'WV',
  WI: 'WI', 'WISCONSIN': 'WI', WY: 'WY', 'WYOMING': 'WY', PR: 'PR', 'PUERTO RICO': 'PR',
  VI: 'VI', 'VIRGIN ISLANDS': 'VI', GU: 'GU', 'GUAM': 'GU', MP: 'MP', 'NORTHERN MARIANA ISLANDS': 'MP',
  AS: 'AS', 'AMERICAN SAMOA': 'AS',
  'D.C.': 'DC', 'WASHINGTON DC': 'DC', 'WASHINGTON, DC': 'DC', 'WASHINGTON D.C.': 'DC',
};
const POSTAL_FIRST: Record<string, string> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC', K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON', R: 'MB', S: 'SK', T: 'AB', V: 'BC', Y: 'YT',
};
/**
 * Two-letter province from OCM's free text ("Ontario ", "Qc", "B.C."), else from the postal code.
 * For the US (B78): the two-letter state from its code or name; ZIP codes aren't mapped.
 */
export function provinceOf(state: string | null | undefined, postcode: string | null | undefined, country: Country = 'ca'): string | null {
  const s = state?.trim().toUpperCase().replace(/\s+/g, ' ');
  if (country === 'us') return s ? (STATES[s] ?? null) : null;
  if (s && PROVINCES[s]) return PROVINCES[s];
  const p = postcode?.trim().toUpperCase()[0];
  return p && POSTAL_FIRST[p] ? POSTAL_FIRST[p] : null;
}

const text = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};
const day = (v: string | null | undefined): string | null => (v ? v.slice(0, 10) : null);

export function portsOf(raw: RawPoi, ignored: Record<string, number>): Port[] {
  const merged = new Map<string, Port>();
  for (const c of raw.Connections ?? []) {
    if (c.StatusTypeID != null && GONE.has(c.StatusTypeID)) continue;
    const count = c.Quantity != null && c.Quantity > 0 ? c.Quantity : 1;
    const plug = c.ConnectionTypeID != null ? PLUG_OF[c.ConnectionTypeID] : undefined;
    if (!plug) {
      if (c.LevelID !== 1) ignored[`ocm-${c.ConnectionTypeID ?? 'none'}`] = (ignored[`ocm-${c.ConnectionTypeID ?? 'none'}`] ?? 0) + count;
      continue;
    }
    // A rating above MAX_KW is a typo in the source (audit 2026-11-18: J1772 at 30,000 kW): unknown.
    const kw = c.PowerKW != null && c.PowerKW > 0 && c.PowerKW <= MAX_KW ? c.PowerKW : null;
    const level = levelOf(c.LevelID, plug, kw);
    if (level === null) continue;
    const key = `${level}|${plug}|${kw ?? ''}`;
    const prev = merged.get(key);
    if (prev) prev.count += count;
    else merged.set(key, { level, plug, kw, count });
  }
  return [...merged.values()].sort((a, b) => b.level - a.level || a.plug.localeCompare(b.plug) || (b.kw ?? -1) - (a.kw ?? -1));
}

function networkOf(operator: string | undefined, ports: Port[]): string | null {
  if (!operator) return null;
  // OCM: "Tesla (Tesla-only charging)" / "Tesla (including non-tesla)". AFDC names Superchargers
  // "Tesla" and destination chargers "Tesla Destination"; the map's Tesla flags rely on that.
  if (/^Tesla\b/.test(operator)) return ports.some((p) => p.level === 3) ? 'Tesla' : 'Tesla Destination';
  return operator in NETWORK_OF ? NETWORK_OF[operator] : operator;
}

export interface OcmNormalizeResult {
  stations: OcmStation[];
  dropped: Record<OcmDropReason, number>;
  ignored_ports: Record<string, number>;
}

/** Canada's bounding box. A point outside it has bad coordinates (e.g. a longitude with the wrong sign) and is dropped as no_location. */
export function inCanada(lat: number, lon: number): boolean {
  return lat >= 41.6 && lat <= 83.2 && lon >= -141.1 && lon <= -52.5;
}

/** Whether a point is inside the country the pull is for: Canada's tight box, or the US boxes (B78). */
export function inCountry(country: Country, lat: number, lon: number): boolean {
  return country === 'ca' ? inCanada(lat, lon) : inCountryBox(country, lat, lon);
}

/** `operators`: OCM operator id → name, from the reference data pulled with the POIs. */
export function normalizeOcm(raw: readonly RawPoi[], operators: ReadonlyMap<number, string>, country: Country = 'ca'): OcmNormalizeResult {
  const dropped: Record<OcmDropReason, number> = { provider: 0, unpublished: 0, not_operational: 0, private: 0, no_location: 0, no_port_data: 0, no_l2_l3_ports: 0 };
  const ignored_ports: Record<string, number> = {};
  const stations: OcmStation[] = [];
  for (const r of raw) {
    if (r.DataProviderID == null || !OCM_PROVIDERS[r.DataProviderID]) { dropped.provider++; continue; }
    if (r.SubmissionStatusTypeID == null || !PUBLISHED.has(r.SubmissionStatusTypeID)) { dropped.unpublished++; continue; }
    if (r.StatusTypeID != null && GONE.has(r.StatusTypeID)) { dropped.not_operational++; continue; }
    if (r.UsageTypeID != null && PRIVATE.has(r.UsageTypeID)) { dropped.private++; continue; }
    const a = r.AddressInfo ?? {};
    if (typeof a.Latitude !== 'number' || typeof a.Longitude !== 'number' || !inCountry(country, a.Latitude, a.Longitude)) { dropped.no_location++; continue; }
    const ports = portsOf(r, ignored_ports);
    if (ports.length === 0) {
      const listed = (r.Connections ?? []).some((c) => !(c.StatusTypeID != null && GONE.has(c.StatusTypeID)) && c.ConnectionTypeID != null && c.ConnectionTypeID !== 0);
      dropped[listed ? 'no_l2_l3_ports' : 'no_port_data']++;
      continue;
    }
    const id = OCM_ID_OFFSET + r.ID;
    const unavailable = r.StatusTypeID === TEMPORARILY_UNAVAILABLE;
    stations.push({
      id,
      name: text(a.Title) ?? `OCM #${r.ID}`,
      street: text(a.AddressLine1),
      city: text(a.Town),
      province: provinceOf(a.StateOrProvince, a.Postcode, country),
      postal: text(a.Postcode),
      lat: a.Latitude,
      lon: a.Longitude,
      network: networkOf(r.OperatorID != null ? operators.get(r.OperatorID) : undefined, ports),
      status: unavailable ? 'T' : 'E',
      expected_date: null,
      restricted: r.UsageTypeID != null && RESTRICTED.has(r.UsageTypeID),
      access_detail: null,
      hours: text(a.AccessComments),
      pricing: text(r.UsageCost),
      pricing_fr: null,
      updated: day(r.DateLastStatusUpdate ?? r.DateLastVerified),
      confirmed: day(r.DateLastVerified),
      ports,
      provider: r.DataProviderID,
      verified: day(r.DateLastVerified),
    });
  }
  stations.sort((x, y) => x.id - y.id);
  return { stations, dropped, ignored_ports };
}

export interface OcmStationsFile {
  source: `ocm-${Country}`;
  source_id: string;
  fetched_at: string;
  raw_sha256: string;
  raw_count: number;
  dropped: Record<OcmDropReason, number>;
  ignored_ports: Record<string, number>;
  stations: OcmStation[];
}
