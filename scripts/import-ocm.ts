// `npm run import:ocm`: reads the raw Open Charge Map pull in sources/ocm-ca/ and writes
// data/imported/ocm/stations.json (published, public, open-licensed L2 / L3 stations; DESIGN-6 P2).
// Duplicates of AFDC stations stay in this file: the map build removes them against the current
// AFDC data (scripts/lib/ocm-merge.ts), so a change on either side is handled.
//
// Same checks as AFDC (scripts/lib/afdc-checks.ts): a > 10 % drop or many records missing fields
// writes nothing to data/ and exits 1. A summary (checks, changes, duplicates found, near misses)
// goes to sources/ocm-ca/summary.md (git-ignored) for the refresh PR.
// `--skip-checks` writes anyway (owner override after a real, reviewed drop).

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serializeStationsFile, type StationsFile } from './lib/afdc.ts';
import { checkAfdc, summaryMarkdown } from './lib/afdc-checks.ts';
import { normalizeOcm, type OcmStationsFile, type RawPoi } from './lib/ocm.ts';
import { mergeOcm, type SkipEntry } from './lib/ocm-merge.ts';
import { OCM_SOURCE_ID } from '../src/lib/map-data.ts';


const root = process.cwd();
const rawDir = join(root, 'sources', 'ocm-ca');
const outDir = join(root, 'data', 'imported', 'ocm');
const outFile = join(outDir, 'stations.json');
const skipFile = join(outDir, 'skip.json');
const summaryFile = join(rawDir, 'summary.md');
const skipChecks = process.argv.includes('--skip-checks');

const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as {
  file: string;
  reference_file: string;
  fetched_at: string;
  sha256: string;
  requests: number;
};
const raw = JSON.parse(readFileSync(join(rawDir, meta.file), 'utf8')) as RawPoi[];
const ref = JSON.parse(readFileSync(join(rawDir, meta.reference_file), 'utf8')) as { Operators: { ID: number; Title: string }[] };
const operators = new Map(ref.Operators.map((o) => [o.ID, o.Title]));
const { stations, dropped, ignored_ports } = normalizeOcm(raw, operators);

const next: OcmStationsFile = {
  source: 'ocm-ca',
  source_id: OCM_SOURCE_ID,
  fetched_at: meta.fetched_at,
  raw_sha256: meta.sha256,
  raw_count: raw.length,
  dropped,
  ignored_ports,
  stations,
};
const prev = existsSync(outFile) ? (JSON.parse(readFileSync(outFile, 'utf8')) as OcmStationsFile) : null;
const result = checkAfdc(prev, next);

// Duplicates against today's AFDC file, for the summary (the map build does the same).
const afdc = JSON.parse(readFileSync(join(root, 'data', 'imported', 'afdc', 'stations.json'), 'utf8')) as StationsFile;
const skip = existsSync(skipFile) ? (JSON.parse(readFileSync(skipFile, 'utf8')) as { skip: SkipEntry[] }).skip : [];
const merge = mergeOcm(stations, afdc.stations, skip);
const d = merge.dropped;
const extra = [
  '',
  `OCM requests this month: ${meta.requests}. Records: ${raw.length} raw → ${stations.length} usable → **${merge.kept.length} on the map** after duplicates.`,
  `Duplicates of AFDC stations removed: ${d.place} same place, ${d.address} same address, ${d.name} same name, ${d.skip} skip list.`,
  '',
  merge.nearMisses.length
    ? `### Kept but within 500 m of an AFDC station (check for duplicates; add any to data/imported/ocm/skip.json)\n\n| OCM id | OCM name | AFDC name | Distance |\n|---|---|---|---:|\n` +
      merge.nearMisses
        .sort((a, b) => a.km - b.km)
        .map((n) => `| [${n.ocm.id}](https://openchargemap.org/site/poi/details/${n.ocm.id}) | ${n.ocm.name.replace(/\|/g, '/')} | ${n.afdc.name.replace(/\|/g, '/')} | ${Math.round(n.km * 1000)} m |`)
        .join('\n')
    : 'No OCM station kept within 500 m of an AFDC station.',
  '',
].join('\n');
writeFileSync(summaryFile, summaryMarkdown(result, meta.fetched_at, 'Open Charge Map Canada') + extra);

const t = result.totals;
const changedCount = t.added.L3 + t.added.L2 + t.removed.L3 + t.removed.L2 + t.changed.L3 + t.changed.L2;
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `ok=${result.ok}\nchanged=${changedCount > 0}\nsummary=${summaryFile}\n`);
}

console.log(`import:ocm: ${raw.length} raw → ${stations.length} kept; dropped ${JSON.stringify(dropped)}; ignored ports ${JSON.stringify(ignored_ports)}`);
console.log(`import:ocm: on the map after duplicates: ${merge.kept.length} (removed ${JSON.stringify(d)}; near misses ${merge.nearMisses.length})`);
if (!result.ok && !skipChecks) {
  for (const f of result.failures) console.error(`import:ocm: check failed: ${f}`);
  console.error(`import:ocm: data/ left unchanged. Summary in ${summaryFile}. Use --skip-checks to override.`);
  process.exit(1);
}
if (!result.ok) console.warn('import:ocm: checks failed but --skip-checks was given; writing anyway.');

mkdirSync(outDir, { recursive: true });
// Same layout as the AFDC file: one station per line, so refresh diffs show only changed stations.
writeFileSync(outFile, serializeStationsFile(next));
if (!existsSync(skipFile)) writeFileSync(skipFile, JSON.stringify({ about: 'OCM POI ids the owner marked as duplicates of AFDC stations (DESIGN-6 P3). Each: { ocm_id, reason }.', skip: [] }, null, 2) + '\n');
console.log(`import:ocm: checks ${result.ok ? 'passed' : 'skipped'}; added ${t.added.L3 + t.added.L2}, removed ${t.removed.L3 + t.removed.L2}, changed ${t.changed.L3 + t.changed.L2}. Summary in ${summaryFile}.`);
