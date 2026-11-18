// `npm run fetch:geonames [-- --country=us]`: downloads the GeoNames dump for Canada (CA.zip, the
// default) or the US (US.zip, B78) and writes that country's populated places at or above its
// population floor (1,000 for Canada, 2,000 for the US: scripts/lib/geonames.ts) to
// data/imported/geonames/places-<cc>.json (B45, data-sources.md §5a). Refreshed by hand when
// needed; no key. The zip itself is not kept: the committed file records its URL, date and checksum.
//
// GeoNames data is CC BY 4.0; the credit is on the About page (data/sources/src-geonames.json).

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MIN_POPULATION_FOR, parseGeonames, unzipEntry, type GeoCountry } from './lib/geonames.ts';
import { countryArg } from './lib/countries.ts';

export const geonamesUrl = (country: GeoCountry) => `https://download.geonames.org/export/dump/${country}.zip`;
/** A healthy pull has thousands of places; fewer means the dump changed shape. */
const MIN_PLACES: Record<GeoCountry, number> = { CA: 1000, US: 5000 };
const OUT_DIR = join(process.cwd(), 'data', 'imported', 'geonames');

/** Pretty-prints the header but keeps one place per line, so diffs stay readable and the file small. */
export function formatPlacesFile(out: { places: unknown[] } & Record<string, unknown>): string {
  const { places, ...head } = out;
  const headJson = JSON.stringify(head, null, 2).slice(0, -2);
  return `${headJson},\n  "places": [\n${places.map((p) => `    ${JSON.stringify(p)}`).join(',\n')}\n  ]\n}\n`;
}

async function main() {
  const country = countryArg(process.argv.slice(2)).toUpperCase() as GeoCountry;
  const url = geonamesUrl(country);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GeoNames download failed: HTTP ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  // The US dump is ~300 MB unzipped: parsed from the bytes, never one big string.
  const { places, lines, below_min_population } = parseGeonames(unzipEntry(zip, `${country}.txt`), country);
  if (places.length < MIN_PLACES[country]) throw new Error(`only ${places.length} places parsed from ${lines} lines; check the dump format`);

  const out = {
    source: `geonames-${country.toLowerCase()}`,
    source_id: 'src-geonames',
    url,
    fetched_at: new Date().toISOString(),
    zip_sha256: createHash('sha256').update(zip).digest('hex'),
    min_population: MIN_POPULATION_FOR[country],
    places,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const name = `places-${country.toLowerCase()}.json`;
  writeFileSync(join(OUT_DIR, name), formatPlacesFile(out));
  console.log(
    `fetch:geonames: ${name}: ${places.length} places (population ≥ ${MIN_POPULATION_FOR[country]}) from ${lines} lines; ` +
      `${below_min_population} smaller populated places left out`,
  );
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-geonames.ts')) {
  main().catch((e) => {
    console.error(`fetch:geonames: ${(e as Error).message}`);
    process.exit(1);
  });
}
