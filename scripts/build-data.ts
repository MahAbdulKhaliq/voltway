// `npm run data:build`: runs the data build (scripts/lib/build.ts) and writes
//   public/data/index.json          small list for browse/search
//   public/data/cars/<id>.json      one detail file per variant
//   public/data/map/{l3,l2,meta}.json  charger map (scripts/lib/map-build.ts)
//   public/data/places.json         trip planner From/To places (GeoNames, B45)
// public/data/ is generated on every build (and git-ignored); the source of truth is data/.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { StationsFile } from './lib/afdc.ts';
import type { OcmStationsFile } from './lib/ocm.ts';
import type { SkipEntry } from './lib/ocm-merge.ts';
import { buildCars } from './lib/build.ts';
import { toPlaceRows, type Place } from './lib/geonames.ts';
import { buildMap } from './lib/map-build.ts';
import { mapOutputProblems, outputProblems } from './lib/output-check.ts';

const root = process.cwd();
const out = join(root, 'public', 'data');
const { cars, index, estimates, report } = buildCars(root);

// Fail the build on any unsourced figure in the output, not only in the input (rule: no bare numbers).
const problems = cars.flatMap(outputProblems);

// Charger map: built from the imported AFDC file, which is committed; a missing file fails the build
// instead of quietly shipping a site without map data.
const stationsFile = join(root, 'data', 'imported', 'afdc', 'stations.json');
if (!existsSync(stationsFile)) {
  console.error('data:build: data/imported/afdc/stations.json is missing; run npm run import:afdc.');
  process.exit(1);
}
// Open Charge Map (B77) is optional: until its first import the map is AFDC only.
const ocmFile = join(root, 'data', 'imported', 'ocm', 'stations.json');
const ocmSkip = join(root, 'data', 'imported', 'ocm', 'skip.json');
const map = buildMap(
  JSON.parse(readFileSync(stationsFile, 'utf8')) as StationsFile,
  existsSync(ocmFile) ? (JSON.parse(readFileSync(ocmFile, 'utf8')) as OcmStationsFile) : null,
  existsSync(ocmSkip) ? (JSON.parse(readFileSync(ocmSkip, 'utf8')) as { skip: SkipEntry[] }).skip : [],
);
{
  const sourceIds = new Set(readdirSync(join(root, 'data', 'sources')).map((f) => f.replace(/\.json$/, '')));
  problems.push(...mapOutputProblems('map/l3.json', map.l3, sourceIds), ...mapOutputProblems('map/l2.json', map.l2, sourceIds));
}

// Places for the trip planner (B45): also committed; a missing file fails the build.
const placesPath = join(root, 'data', 'imported', 'geonames', 'places.json');
if (!existsSync(placesPath)) {
  console.error('data:build: data/imported/geonames/places.json is missing; run npm run fetch:geonames.');
  process.exit(1);
}
const placesFile = JSON.parse(readFileSync(placesPath, 'utf8')) as { places: Place[] };

if (problems.length) {
  console.error(`data:build: ${problems.length} unsourced or incomplete item(s) in the output:`);
  for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'cars'), { recursive: true });
writeFileSync(join(out, 'index.json'), JSON.stringify(index));
writeFileSync(join(out, 'estimates.json'), JSON.stringify(estimates));
for (const car of cars) {
  const file = join(out, 'cars', `${car.id}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(car));
}

const unknown = Object.entries(report.unknownByField).map(([k, n]) => `${k} ${n}`).join(', ');
console.log(`data:build: ${report.cars} cars → public/data/ · default curves ${JSON.stringify(report.curves)} · ${report.conflicts} fields flagged "sources differ"`);
if (unknown) console.log(`  still "Unknown" (shown as such on the site): ${unknown}`);

if (map) {
  mkdirSync(join(out, 'map'), { recursive: true });
  const sizes: string[] = [];
  for (const [name, data] of [['l3', map.l3], ['l2', map.l2], ['meta', map.meta]] as const) {
    const json = JSON.stringify(data);
    writeFileSync(join(out, 'map', `${name}.json`), json);
    sizes.push(`${name} ${(json.length / 1e6).toFixed(2)} MB (${(gzipSync(json).length / 1e6).toFixed(2)} MB gz)`);
  }
  console.log(`data:build: map ${map.meta.counts.l3} L3 + ${map.meta.counts.l2} L2-only stations → public/data/map/ · ${sizes.join(', ')}`);
  if (map.ocm) console.log(`data:build: Open Charge Map adds ${map.ocm.kept.length} stations (duplicates of AFDC removed: ${JSON.stringify(map.ocm.dropped)})`);
}

// Trip planner places (B45): short-key rows for From/To suggestions, from the committed GeoNames import.
{
  const json = JSON.stringify(toPlaceRows(placesFile.places));
  writeFileSync(join(out, 'places.json'), json);
  console.log(`data:build: ${placesFile.places.length} places → public/data/places.json · ${(json.length / 1e6).toFixed(2)} MB (${(gzipSync(json).length / 1e6).toFixed(2)} MB gz)`);
}
