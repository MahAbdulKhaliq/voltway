// `npm run merge:trim-names`: copies researched names from research/trim-names-<group>.csv into
// crosswalk/trim-names.csv (B91, DESIGN-9 §2). Only trim_name, dealer_trims, source_url and notes are
// copied; confirmed stays as it is (approving a catalogue proposal confirms its names). A researched
// row must carry a source_url; rows without one are reported and skipped.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from './lib/csv.ts';
import { trimNameKey } from './lib/catalogue.ts';

const root = process.cwd();
const file = join(root, 'crosswalk/trim-names.csv');
const text = readFileSync(file, 'utf8');
const header = text.slice(0, text.indexOf('\n')).replace(/\r$/, '').split(',');
const rows = parseCsv(text);
const byKey = new Map(rows.map((r) => [trimNameKey(r.source, r.year, r.label), r]));
const loose = (source: string, year: string, label: string) => trimNameKey(source, year, label.replace(/["″]/g, ''));
const byLoose = new Map(rows.map((r) => [loose(r.source, r.year, r.label), r]));

const dir = join(root, 'research');
const only = process.argv.slice(2); // optional groups, e.g. `npm run merge:trim-names -- japan hyundai-kia`
const files = (existsSync(dir) ? readdirSync(dir).filter((f) => /^trim-names-(?!input-).+\.csv$/.test(f)) : [])
  .filter((f) => !only.length || only.some((g) => f === `trim-names-${g}.csv`));
let filled = 0;
const unknown: string[] = [];
const unsourced: string[] = [];
for (const f of files) {
  for (const r of parseCsv(readFileSync(join(dir, f), 'utf8'))) {
    // Hand-written CSVs sometimes lose the inch mark in `(18" Wheels)`; match without quote marks too.
    const ours = byKey.get(trimNameKey(r.source, r.year, r.label)) ?? byLoose.get(loose(r.source, r.year, r.label));
    if (!ours) { unknown.push(`${f}: ${r.year} ${r.label}`); continue; }
    if (!r.trim_name && !r.notes) continue;
    if (r.trim_name && !r.source_url) { unsourced.push(`${f}: ${r.year} ${r.label}`); continue; }
    for (const k of ['trim_name', 'dealer_trims', 'source_url', 'notes']) if (r[k] !== undefined) ours[k] = r[k];
    filled++;
  }
}
writeFileSync(file, toCsv(header, rows));
console.log(`merge-trim-names: ${filled} rows from ${files.length} files; ${rows.filter((r) => r.trim_name).length}/${rows.length} labels named`);
if (unknown.length) console.log(`  not in trim-names.csv (label changed?):\n    ${unknown.join('\n    ')}`);
if (unsourced.length) console.log(`  skipped, no source_url:\n    ${unsourced.join('\n    ')}`);
