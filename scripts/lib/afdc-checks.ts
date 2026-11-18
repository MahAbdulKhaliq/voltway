// Sanity checks for a new AFDC import against the last committed one, plus a
// change summary for the refresh PR (DESIGN-map.md M3, charger-map.md §3).
// The refresh PR merges itself on green (B27), so these checks are the gate:
// a failed check stops the import and leaves the committed file as it was.

import type { Station } from './afdc.ts';

/** What the checks read from an import file: AFDC (afdc.ts) and OCM (ocm.ts) both fit. */
export interface CheckedFile {
  stations: Station[];
  dropped: { no_location: number; no_l2_l3_ports: number };
}

export interface CheckOptions {
  /** Fail when the kept count falls by more than this share of the last committed count. */
  maxDropShare: number;
  /** Fail when more than this share of usable stations lack coordinates, level or plugs. */
  maxMissingShare: number;
}

export const DEFAULT_CHECKS: CheckOptions = { maxDropShare: 0.1, maxMissingShare: 0.02 };

/** A loose box around Canada; a station outside it has bad coordinates. */
const CANADA = { latMin: 41, latMax: 84, lonMin: -142, lonMax: -52 };

export type StationLevel = 'L3' | 'L2';
const LEVELS: StationLevel[] = ['L3', 'L2'];

/** A station counts as Level 3 if any port is Level 3 (a mixed site shows on the Level 3 layer). */
export function stationLevel(s: Pick<Station, 'ports'>): StationLevel {
  return s.ports.some((p) => p.level === 3) ? 'L3' : 'L2';
}

function hasCoordinates(s: Station): boolean {
  return (
    Number.isFinite(s.lat) &&
    Number.isFinite(s.lon) &&
    s.lat >= CANADA.latMin &&
    s.lat <= CANADA.latMax &&
    s.lon >= CANADA.lonMin &&
    s.lon <= CANADA.lonMax
  );
}

function hasLevelAndPlugs(s: Station): boolean {
  return (
    Array.isArray(s.ports) &&
    s.ports.length > 0 &&
    s.ports.every((p) => (p.level === 2 || p.level === 3) && typeof p.plug === 'string' && p.count > 0)
  );
}

type Counts = Record<'added' | 'removed' | 'changed', Record<StationLevel, number>>;
const zero = (): Counts => ({
  added: { L3: 0, L2: 0 },
  removed: { L3: 0, L2: 0 },
  changed: { L3: 0, L2: 0 },
});

export interface CheckResult {
  ok: boolean;
  failures: string[];
  prevCount: number | null;
  nextCount: number;
  /** Public, non-planned stations missing coordinates, level or plugs (dropped or kept). */
  missing: number;
  /** Public, non-planned stations in the raw pull: kept + dropped for missing fields. */
  usable: number;
  byProvince: Map<string, Counts>;
  totals: Counts;
}

/**
 * Compares the new import with the last committed one (null on the first import).
 * Missing required fields are counted over the raw pull's usable stations: the
 * normaliser drops a station with no location or no L2/L3 port, so those drops are
 * the "missing" cases, plus any kept station that somehow fails the same test.
 */
export function checkAfdc(prev: CheckedFile | null, next: CheckedFile, opts: CheckOptions = DEFAULT_CHECKS): CheckResult {
  const failures: string[] = [];
  const nextCount = next.stations.length;
  const prevCount = prev ? prev.stations.length : null;

  if (prevCount !== null && prevCount > 0) {
    const drop = (prevCount - nextCount) / prevCount;
    if (drop > opts.maxDropShare) {
      failures.push(
        `Station count fell ${pct(drop)} (${prevCount} → ${nextCount}); the limit is ${pct(opts.maxDropShare)}.`,
      );
    }
  }

  const badKept = next.stations.filter((s) => !hasCoordinates(s) || !hasLevelAndPlugs(s)).length;
  const missing = next.dropped.no_location + next.dropped.no_l2_l3_ports + badKept;
  const usable = nextCount + next.dropped.no_location + next.dropped.no_l2_l3_ports;
  if (usable === 0) {
    failures.push('The new import has no usable stations.');
  } else if (missing / usable > opts.maxMissingShare) {
    failures.push(
      `${missing} of ${usable} stations (${pct(missing / usable)}) lack coordinates, level or plugs; the limit is ${pct(opts.maxMissingShare)}.`,
    );
  }

  const byProvince = new Map<string, Counts>();
  const totals = zero();
  const bump = (kind: keyof Counts, s: Station) => {
    const prov = s.province ?? '—';
    if (!byProvince.has(prov)) byProvince.set(prov, zero());
    const lvl = stationLevel(s);
    byProvince.get(prov)![kind][lvl]++;
    totals[kind][lvl]++;
  };
  const before = new Map((prev?.stations ?? []).map((s) => [s.id, s]));
  const after = new Map(next.stations.map((s) => [s.id, s]));
  for (const [id, s] of after) {
    const old = before.get(id);
    if (!old) bump('added', s);
    else if (JSON.stringify(old) !== JSON.stringify(s)) bump('changed', s);
  }
  for (const [id, s] of before) if (!after.has(id)) bump('removed', s);

  return { ok: failures.length === 0, failures, prevCount, nextCount, missing, usable, byProvince, totals };
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)} %`;
}

/** Markdown for the refresh PR body: check results, then changes by province and level. */
export function summaryMarkdown(r: CheckResult, fetchedAt: string, source = 'AFDC Canada'): string {
  const lines: string[] = [];
  lines.push(`## Charger data refresh (${source}, fetched ${fetchedAt})`, '');
  lines.push(r.ok ? '**Sanity checks: passed.**' : '**Sanity checks: FAILED.** Nothing goes live until the owner reviews this.', '');
  for (const f of r.failures) lines.push(`- ${f}`);
  if (r.failures.length) lines.push('');
  lines.push(
    `- Stations kept: ${r.prevCount ?? '(none before)'} → ${r.nextCount}`,
    `- Missing coordinates, level or plugs: ${r.missing} of ${r.usable}`,
    '',
  );
  const t = r.totals;
  const sum = (k: keyof Counts) => t[k].L3 + t[k].L2;
  if (sum('added') + sum('removed') + sum('changed') === 0) {
    lines.push('No station was added, removed or changed.');
    return lines.join('\n') + '\n';
  }
  lines.push(
    `Added ${sum('added')}, removed ${sum('removed')}, changed ${sum('changed')}.`,
    '',
    '| Province | Added L3 | Added L2 | Removed L3 | Removed L2 | Changed L3 | Changed L2 |',
    '|---|---:|---:|---:|---:|---:|---:|',
  );
  const row = (name: string, c: Counts) =>
    `| ${name} | ${(['added', 'removed', 'changed'] as const).flatMap((k) => LEVELS.map((l) => c[k][l])).join(' | ')} |`;
  for (const prov of [...r.byProvince.keys()].sort()) lines.push(row(prov, r.byProvince.get(prov)!));
  lines.push(row('**Total**', t));
  return lines.join('\n') + '\n';
}
