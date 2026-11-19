// `npm run import:epa`: reads the EV extract in sources/epa/ and writes one normalized file per
// model year to data/imported/epa/<year>.json (B90). Regenerated on every import; review as git diffs.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from './lib/csv.ts';
import { normalizeEpaRows, type EpaRecord } from './lib/epa.ts';

const root = process.cwd();
const rawDir = join(root, 'sources', 'epa');
const outDir = join(root, 'data', 'imported', 'epa');

const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as { file: string; suggested_source_id: string };
const sourceId = meta.suggested_source_id;
try {
  readFileSync(join(root, 'data', 'sources', `${sourceId}.json`));
} catch {
  throw new Error(`No source record ${sourceId}. Create data/sources/${sourceId}.json for this EPA download first.`);
}

const records = normalizeEpaRows(parseCsv(readFileSync(join(rawDir, meta.file), 'utf8')), sourceId);
const byYear = new Map<number, EpaRecord[]>();
for (const r of records) byYear.set(r.year, [...(byYear.get(r.year) ?? []), r]);

mkdirSync(outDir, { recursive: true });
for (const old of readdirSync(outDir)) rmSync(join(outDir, old));
for (const [year, list] of [...byYear].sort(([a], [b]) => a - b)) {
  writeFileSync(join(outDir, `${year}.json`), JSON.stringify({ source: 'epa', source_id: sourceId, year, records: list }, null, 2) + '\n');
}
console.log(`import:epa: ${records.length} rows → ${byYear.size} files in data/imported/epa/ (source ${sourceId}); per year ${[...byYear].map(([y, l]) => `${y}:${l.length}`).join(' ')}`);
