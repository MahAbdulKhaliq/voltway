// `npm run import:nrcan`: reads the raw CSV in sources/nrcan/ and writes one
// normalized file per model year to data/imported/nrcan/<year>.json.
// These files are regenerated on every import; review changes as git diffs.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from './lib/csv.ts';
import { normalizeNrcanRows, type NrcanRecord } from './lib/nrcan.ts';

const root = process.cwd();
const rawDir = join(root, 'sources', 'nrcan');
const outDir = join(root, 'data', 'imported', 'nrcan');

const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as { file: string; suggested_source_id: string };
const sourceId = meta.suggested_source_id;
const sourceFile = join(root, 'data', 'sources', `${sourceId}.json`);
try {
  readFileSync(sourceFile);
} catch {
  throw new Error(`No source record ${sourceId}. Create data/sources/${sourceId}.json for this NRCan edition first.`);
}

const records = normalizeNrcanRows(parseCsv(readFileSync(join(rawDir, meta.file), 'utf8')), sourceId);

const byYear = new Map<number, NrcanRecord[]>();
for (const r of records) byYear.set(r.year, [...(byYear.get(r.year) ?? []), r]);

mkdirSync(outDir, { recursive: true });
for (const old of readdirSync(outDir)) rmSync(join(outDir, old));
for (const [year, list] of [...byYear].sort(([a], [b]) => a - b)) {
  list.sort((a, b) => a.source_key.localeCompare(b.source_key));
  const file = { source: 'nrcan', source_id: sourceId, year, records: list };
  writeFileSync(join(outDir, `${year}.json`), JSON.stringify(file, null, 2) + '\n');
}
console.log(`import:nrcan: ${records.length} rows → ${byYear.size} files in data/imported/nrcan/ (source ${sourceId})`);
