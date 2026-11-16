// What changed between the committed copy of an upstream dataset and a fresh download (8.1).
// Used by scripts/check-sources.ts to describe a refresh pull request. Pure functions, tested.

import { parseCsv } from './csv.ts';
import { NRCAN_COLUMNS, nrcanKey } from './nrcan.ts';

export interface RowDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

const diffMaps = (before: Map<string, string>, after: Map<string, string>): RowDiff => {
  const sort = (xs: string[]) => xs.sort((a, b) => a.localeCompare(b));
  return {
    added: sort([...after.keys()].filter((k) => !before.has(k))),
    removed: sort([...before.keys()].filter((k) => !after.has(k))),
    changed: sort([...after.keys()].filter((k) => before.has(k) && before.get(k) !== after.get(k))),
  };
};

const nrcanRows = (csv: string) => {
  const rows = new Map<string, string>();
  for (const raw of parseCsv(csv)) {
    const r = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.trim(), v.trim()]));
    const year = Number(r[NRCAN_COLUMNS.year]);
    if (!year) continue; // footnote lines
    rows.set(nrcanKey(year, r[NRCAN_COLUMNS.make], r[NRCAN_COLUMNS.model]), JSON.stringify(r));
  }
  return rows;
};

/** NRCan CSV editions, row by row (year · make · model). `before` null = nothing committed yet. */
export function diffNrcan(before: string | null, after: string): RowDiff {
  return diffMaps(before ? nrcanRows(before) : new Map(), nrcanRows(after));
}

interface OpenEvLike {
  unique_code?: string;
  year?: number;
  make?: { name?: string };
  model?: { name?: string };
  trim?: { name?: string };
  variant?: { name?: string };
  markets?: string[];
}

const openevLabel = (v: OpenEvLike) =>
  [v.year, v.make?.name, v.model?.name, v.trim?.name, v.variant?.name].filter(Boolean).join(' ');

const openevRows = (json: string, northAmericaOnly: boolean) => {
  const rows = new Map<string, string>();
  for (const v of (JSON.parse(json) as { vehicles: OpenEvLike[] }).vehicles) {
    if (northAmericaOnly && !(v.markets ?? []).some((m) => m === 'CA' || m === 'US')) continue;
    const label = openevLabel(v);
    rows.set(v.unique_code ? `${label} (${v.unique_code})` : label, JSON.stringify(v));
  }
  return rows;
};

/** OpenEV Data releases, vehicle by vehicle. North American vehicles only by default (the rest aren't imported). */
export function diffOpenEv(before: string | null, after: string, northAmericaOnly = true): RowDiff {
  return diffMaps(before ? openevRows(before, northAmericaOnly) : new Map(), openevRows(after, northAmericaOnly));
}

/** Markdown section for a pull request body; long lists are cut to `limit` entries. */
export function describeDiff(title: string, d: RowDiff, limit = 40): string {
  const list = (label: string, xs: string[]) => {
    if (!xs.length) return '';
    const shown = xs.slice(0, limit).map((x) => `- ${x}`).join('\n');
    const more = xs.length > limit ? `\n- …and ${xs.length - limit} more` : '';
    return `\n**${label} (${xs.length})**\n\n${shown}${more}\n`;
  };
  const none = !d.added.length && !d.removed.length && !d.changed.length ? '\nThe file changed, but no rows did (formatting or metadata only).\n' : '';
  return `### ${title}\n${list('New', d.added)}${list('Removed', d.removed)}${list('Changed', d.changed)}${none}`;
}
