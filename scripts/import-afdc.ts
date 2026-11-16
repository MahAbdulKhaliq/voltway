// `npm run import:afdc`: reads the raw AFDC pull in sources/afdc-ca/ and writes
// data/imported/afdc/stations.json (public Level 2 / Level 3 stations only).
// Regenerated on every import; review changes as git diffs.
//
// Before writing, the new result is checked against the committed file
// (scripts/lib/afdc-checks.ts). A failed check writes nothing to data/ and exits 1.
// Either way a change summary goes to sources/afdc-ca/summary.md (git-ignored),
// which the daily refresh workflow uses as the PR body.
// `--skip-checks` writes anyway (owner override after a real, reviewed drop).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeStations, serializeStationsFile, type RawStation, type StationsFile } from './lib/afdc.ts';
import { checkAfdc, summaryMarkdown } from './lib/afdc-checks.ts';

export const AFDC_SOURCE_ID = 'src-afdc-ca';

const root = process.cwd();
const rawDir = join(root, 'sources', 'afdc-ca');
const outDir = join(root, 'data', 'imported', 'afdc');
const outFile = join(outDir, 'stations.json');
const summaryFile = join(rawDir, 'summary.md');
const skipChecks = process.argv.includes('--skip-checks');

const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as {
  file: string;
  fetched_at: string;
  sha256: string;
};
const raw = JSON.parse(readFileSync(join(rawDir, meta.file), 'utf8')) as { fuel_stations: RawStation[] };
const { stations, dropped, ignored_ports } = normalizeStations(raw.fuel_stations);

const next: StationsFile = {
  source: 'afdc-ca',
  source_id: AFDC_SOURCE_ID,
  fetched_at: meta.fetched_at,
  raw_sha256: meta.sha256,
  raw_count: raw.fuel_stations.length,
  dropped,
  ignored_ports,
  stations,
};
const prev = existsSync(outFile) ? (JSON.parse(readFileSync(outFile, 'utf8')) as StationsFile) : null;
const result = checkAfdc(prev, next);
writeFileSync(summaryFile, summaryMarkdown(result, meta.fetched_at));

console.log(
  `import:afdc: ${raw.fuel_stations.length} raw → ${stations.length} kept; dropped ${JSON.stringify(dropped)}; ignored ports ${JSON.stringify(ignored_ports)}`,
);
if (!result.ok && !skipChecks) {
  for (const f of result.failures) console.error(`import:afdc: check failed: ${f}`);
  console.error(`import:afdc: data/ left unchanged. Summary in ${summaryFile}. Use --skip-checks to override.`);
  process.exit(1);
}
if (!result.ok) console.warn('import:afdc: checks failed but --skip-checks was given; writing anyway.');

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, serializeStationsFile(next));
const t = result.totals;
console.log(
  `import:afdc: checks ${result.ok ? 'passed' : 'skipped'}; added ${t.added.L3 + t.added.L2}, removed ${t.removed.L3 + t.removed.L2}, changed ${t.changed.L3 + t.changed.L2}. Summary in ${summaryFile}.`,
);
