// `npm run fetch:geonames`: downloads the GeoNames Canada dump (CA.zip) and writes the
// Canadian populated places with population ≥ 1,000 to data/imported/geonames/places.json
// (B45, data-sources.md §5a). Refreshed by hand when needed; no key. The zip itself is
// not kept: the committed file records its URL, date and checksum.
//
// GeoNames data is CC BY 4.0; the credit is on the About page (data/sources/src-geonames.json).

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MIN_POPULATION, parseGeonames, unzipEntry } from './lib/geonames.ts';

export const GEONAMES_URL = 'https://download.geonames.org/export/dump/CA.zip';
const OUT_DIR = join(process.cwd(), 'data', 'imported', 'geonames');

/** Pretty-prints the header but keeps one place per line, so diffs stay readable and the file small. */
export function formatPlacesFile(out: { places: unknown[] } & Record<string, unknown>): string {
  const { places, ...head } = out;
  const headJson = JSON.stringify(head, null, 2).slice(0, -2);
  return `${headJson},\n  "places": [\n${places.map((p) => `    ${JSON.stringify(p)}`).join(',\n')}\n  ]\n}\n`;
}

async function main() {
  const res = await fetch(GEONAMES_URL);
  if (!res.ok) throw new Error(`GeoNames download failed: HTTP ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  const text = unzipEntry(zip, 'CA.txt').toString('utf8');
  const { places, lines, below_min_population } = parseGeonames(text);
  // A healthy pull has thousands of places; a tiny one means the dump changed shape.
  if (places.length < 1000) throw new Error(`only ${places.length} places parsed from ${lines} lines; check the dump format`);

  const out = {
    source: 'geonames-ca',
    source_id: 'src-geonames',
    url: GEONAMES_URL,
    fetched_at: new Date().toISOString(),
    zip_sha256: createHash('sha256').update(zip).digest('hex'),
    min_population: MIN_POPULATION,
    places,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'places.json'), formatPlacesFile(out));
  console.log(
    `fetch:geonames: ${places.length} places (population ≥ ${MIN_POPULATION}) from ${lines} lines; ` +
      `${below_min_population} smaller populated places left out`,
  );
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-geonames.ts')) {
  main().catch((e) => {
    console.error(`fetch:geonames: ${(e as Error).message}`);
    process.exit(1);
  });
}
