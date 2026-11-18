// `npm run import:afdc [-- --country=us]`: reads the raw AFDC pull in sources/afdc-<cc>/ and writes
// data/imported/afdc/<cc>.json (public Level 2 / Level 3 stations only). Canada when no country is
// given; each country is checked on its own (DESIGN-7 D1).
// Regenerated on every import; review changes as git diffs.
//
// Before writing, the new result is checked against the committed file
// (scripts/lib/afdc-checks.ts). A failed check writes nothing to data/ and exits 1.
// Either way a change summary goes to sources/afdc-<cc>/summary.md (git-ignored),
// which the refresh workflow uses as the PR body.
// `--skip-checks` writes anyway (owner override after a real, reviewed drop).

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { normalizeStations, serializeStationsFile, type RawStation, type StationsFile } from './lib/afdc.ts';
import { checkAfdc, summaryMarkdown } from './lib/afdc-checks.ts';
import { dropOffLand, makeOnLand } from './lib/land-check.ts';
import { COUNTRY_NAME, countryArg, importedFile, rawDir as rawDirOf } from './lib/countries.ts';

const country = countryArg();
const root = process.cwd();
const rawDir = rawDirOf(root, 'afdc', country);
const outFile = importedFile(root, 'afdc', country);
const outDir = dirname(outFile);
const summaryFile = join(rawDir, 'summary.md');
const skipChecks = process.argv.includes('--skip-checks');

const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as {
  file: string;
  fetched_at: string;
  sha256: string;
};
const raw = JSON.parse(readFileSync(join(rawDir, meta.file), 'utf8')) as { fuel_stations: RawStation[] };
const normalized = normalizeStations(raw.fuel_stations);
const { dropped, ignored_ports } = normalized;
// Off land in its own country → no_location (audit 2026-11-18, F2).
const stations = dropOffLand(normalized.stations, country, makeOnLand(root), dropped);

const next: StationsFile = {
  source: `afdc-${country}`,
  source_id: `src-afdc-${country}`,
  fetched_at: meta.fetched_at,
  raw_sha256: meta.sha256,
  raw_count: raw.fuel_stations.length,
  dropped,
  ignored_ports,
  stations,
};
const prev = existsSync(outFile) ? (JSON.parse(readFileSync(outFile, 'utf8')) as StationsFile) : null;
const result = checkAfdc(prev, next, { country });
writeFileSync(summaryFile, summaryMarkdown(result, meta.fetched_at, `AFDC ${COUNTRY_NAME[country]}`));

// In GitHub Actions, tell the refresh workflow whether the checks passed and whether any
// station changed (the header's fetch date changes on every pull, so a plain git diff can't tell).
const t = result.totals;
const changedCount = t.added.L3 + t.added.L2 + t.removed.L3 + t.removed.L2 + t.changed.L3 + t.changed.L2;
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `ok=${result.ok}\nchanged=${changedCount > 0}\nsummary=${summaryFile}\n`);
}

console.log(
  `import:afdc ${country}: ${raw.fuel_stations.length} raw → ${stations.length} kept; dropped ${JSON.stringify(dropped)}; ignored ports ${JSON.stringify(ignored_ports)}`,
);
if (!result.ok && !skipChecks) {
  for (const f of result.failures) console.error(`import:afdc ${country}: check failed: ${f}`);
  console.error(`import:afdc ${country}: data/ left unchanged. Summary in ${summaryFile}. Use --skip-checks to override.`);
  process.exit(1);
}
if (!result.ok) console.warn(`import:afdc ${country}: checks failed but --skip-checks was given; writing anyway.`);

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, serializeStationsFile(next));
console.log(
  `import:afdc ${country}: checks ${result.ok ? 'passed' : 'skipped'}; added ${t.added.L3 + t.added.L2}, removed ${t.removed.L3 + t.removed.L2}, changed ${t.changed.L3 + t.changed.L2}. Summary in ${summaryFile}.`,
);
