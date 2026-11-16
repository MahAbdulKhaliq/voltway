// `npm run import:afdc`: reads the raw AFDC pull in sources/afdc-ca/ and writes
// data/imported/afdc/stations.json (public Level 2 / Level 3 stations only).
// Regenerated on every import; review changes as git diffs.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeStations, serializeStationsFile, type RawStation } from './lib/afdc.ts';

export const AFDC_SOURCE_ID = 'src-afdc-ca';

const root = process.cwd();
const rawDir = join(root, 'sources', 'afdc-ca');
const outDir = join(root, 'data', 'imported', 'afdc');

const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as {
  file: string;
  fetched_at: string;
  sha256: string;
};
const raw = JSON.parse(readFileSync(join(rawDir, meta.file), 'utf8')) as { fuel_stations: RawStation[] };
const { stations, dropped, ignored_ports } = normalizeStations(raw.fuel_stations);

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'stations.json'),
  serializeStationsFile({
    source: 'afdc-ca',
    source_id: AFDC_SOURCE_ID,
    fetched_at: meta.fetched_at,
    raw_sha256: meta.sha256,
    raw_count: raw.fuel_stations.length,
    dropped,
    ignored_ports,
    stations,
  }),
);
console.log(
  `import:afdc: ${raw.fuel_stations.length} raw → ${stations.length} kept; dropped ${JSON.stringify(dropped)}; ignored ports ${JSON.stringify(ignored_ports)}`,
);
