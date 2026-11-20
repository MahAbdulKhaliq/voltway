// `npm run import:openev`: reads the pinned OpenEV Data release in sources/openev/
// and writes North American records, one file per make, to data/imported/openev/<make>.json.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { formatJson } from './lib/format-json.ts';
import { join } from 'node:path';
import { isNorthAmerican, normalizeOpenEv, type OpenEvRecord, type OpenEvVehicle } from './lib/openev.ts';

const root = process.cwd();
const rawDir = join(root, 'sources', 'openev');
const outDir = join(root, 'data', 'imported', 'openev');

const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as { file: string; suggested_source_id: string };
const sourceId = meta.suggested_source_id;
try {
  readFileSync(join(root, 'data', 'sources', `${sourceId}.json`));
} catch {
  throw new Error(`No source record ${sourceId}. Create data/sources/${sourceId}.json for this OpenEV release first.`);
}

const release = JSON.parse(readFileSync(join(rawDir, meta.file), 'utf8')) as { vehicles: OpenEvVehicle[] };
const na = release.vehicles.filter(isNorthAmerican);

const byMake = new Map<string, OpenEvRecord[]>();
for (const v of na) {
  const rec = normalizeOpenEv(v, sourceId);
  const slug = v.make.slug.replace(/_/g, '-');
  byMake.set(slug, [...(byMake.get(slug) ?? []), rec]);
}

mkdirSync(outDir, { recursive: true });
for (const old of readdirSync(outDir)) rmSync(join(outDir, old));
for (const [make, list] of [...byMake].sort(([a], [b]) => a.localeCompare(b))) {
  list.sort((a, b) => a.source_key.localeCompare(b.source_key));
  writeFileSync(join(outDir, `${make}.json`), formatJson({ source: 'openev', source_id: sourceId, make, records: list }, { oneLine: 'records' }));
}
console.log(
  `import:openev: ${na.length} of ${release.vehicles.length} records are North American → ${byMake.size} files in data/imported/openev/ (source ${sourceId})`,
);
