// `npm run fetch:nrcan`: downloads the current English NRCan BEV ratings CSV into
// sources/nrcan/, with a FETCHED.json recording where, when and its checksum.
// Looks the file up through the open.canada.ca catalogue (CKAN) API, so a new
// edition (e.g. "2012-2027") is picked up without code changes.

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATASET_ID = '98f1a129-f628-4ce4-b24d-6f16bf24dd64'; // Fuel consumption ratings
const CATALOGUE = `https://open.canada.ca/data/api/action/package_show?id=${DATASET_ID}`;
const OUT_DIR = join(process.cwd(), 'sources', 'nrcan');

interface CkanResource {
  id: string;
  name: string;
  name_translated?: { en?: string };
  language: string[];
  format: string;
  url: string;
  last_modified?: string;
  created?: string;
}

async function main() {
  const res = await fetch(CATALOGUE);
  if (!res.ok) throw new Error(`Catalogue request failed: HTTP ${res.status}`);
  const pkg = (await res.json()) as { result: { resources: CkanResource[] } };

  const matches = pkg.result.resources.filter((r) => {
    const name = r.name_translated?.en ?? r.name;
    return /^Battery-electric vehicles/i.test(name) && r.language.includes('en') && r.format.toUpperCase() === 'CSV';
  });
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one English BEV CSV, found ${matches.length}. Check the dataset page by hand.`);
  }
  const resource = matches[0];
  const name = resource.name_translated?.en ?? resource.name;

  const file = await fetch(resource.url, { redirect: 'follow' });
  if (!file.ok) throw new Error(`Download failed: HTTP ${file.status}`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const head = bytes.subarray(0, 40).toString('utf8');
  if (!head.startsWith('Model year,')) throw new Error(`Download doesn't look like the ratings CSV (starts with "${head}")`);

  const fileName = decodeURIComponent(new URL(resource.url).pathname.split('/').pop()!);
  mkdirSync(OUT_DIR, { recursive: true });
  for (const old of readdirSync(OUT_DIR)) rmSync(join(OUT_DIR, old)); // keep only the current edition
  writeFileSync(join(OUT_DIR, fileName), bytes);

  const lastModified = (resource.last_modified ?? resource.created ?? '').slice(0, 10);
  const meta = {
    dataset_id: DATASET_ID,
    resource_id: resource.id,
    resource_name: name,
    resource_page: `https://open.canada.ca/data/en/dataset/${DATASET_ID}/resource/${resource.id}`,
    file: fileName,
    last_modified: lastModified,
    fetched_on: new Date().toISOString().slice(0, 10),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    suggested_source_id: `src-nrcan-bev-${lastModified.slice(0, 7)}`,
  };
  writeFileSync(join(OUT_DIR, 'FETCHED.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`fetch:nrcan: saved ${fileName} (${bytes.length} bytes, ${name})`);
  console.log(`  source id for this edition: ${meta.suggested_source_id}`);
}

main().catch((e) => {
  console.error(`fetch:nrcan: ${(e as Error).message}`);
  process.exit(1);
});
