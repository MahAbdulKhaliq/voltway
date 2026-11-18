// `npm run data:build`: runs the data build (scripts/lib/build.ts) and writes
//   public/data/index.json          small list for browse/search
//   public/data/cars/<id>.json      one detail file per variant
//   public/data/map/                charger map (scripts/lib/map-build.ts, B78): o3.json, o2.json
//                                   (overviews), tiles/<level>/<key>.json, tiles/index.json, meta.json
//   public/data/places-{ca,us}.json trip planner From/To places (GeoNames, B45; US B78)
// public/data/ is generated on every build (and git-ignored); the source of truth is data/.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { StationsFile } from './lib/afdc.ts';
import type { OcmStationsFile } from './lib/ocm.ts';
import type { SkipEntry } from './lib/ocm-merge.ts';
import { buildCars } from './lib/build.ts';
import { toPlaceRows, type Place } from './lib/geonames.ts';
import { buildMap, mapFiles } from './lib/map-build.ts';
import { mapOutputProblems, outputProblems } from './lib/output-check.ts';
import { COUNTRIES, importedFile, importedFiles } from './lib/countries.ts';

const root = process.cwd();
const out = join(root, 'public', 'data');
const { cars, index, estimates, report } = buildCars(root);

// Fail the build on any unsourced figure in the output, not only in the input (rule: no bare numbers).
const problems = cars.flatMap(outputProblems);

// Charger map: built from the imported AFDC files, which are committed, one per country (DESIGN-7 D1).
// A missing Canadian file fails the build instead of quietly shipping a site without map data.
if (!existsSync(importedFile(root, 'afdc', 'ca'))) {
  console.error('data:build: data/imported/afdc/ca.json is missing; run npm run import:afdc.');
  process.exit(1);
}
const readJson = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;
// Open Charge Map (B77) is optional: until its first import the map is AFDC only.
const ocmSkip = join(root, 'data', 'imported', 'ocm', 'skip.json');
const map = buildMap(
  importedFiles(root, 'afdc').map((f) => readJson<StationsFile>(f.path)),
  importedFiles(root, 'ocm').map((f) => readJson<OcmStationsFile>(f.path)),
  existsSync(ocmSkip) ? readJson<{ skip: SkipEntry[] }>(ocmSkip).skip : [],
);
{
  const sourceIds = new Set(readdirSync(join(root, 'data', 'sources')).map((f) => f.replace(/\.json$/, '')));
  // Every record that goes into a detail tile (the Level 3 and Level 2 lists before tiling).
  problems.push(...mapOutputProblems('map tiles (Level 3)', map.l3, sourceIds), ...mapOutputProblems('map tiles (Level 2)', map.l2, sourceIds));
}

// B78 (DESIGN-7 D2): the map loads an overview per level and detail tiles by area. Budgets: no tile
// over 300 KB, and the first load (Level 3 overview + tile index + meta) under 1 MB, all raw.
const { problems: budgetProblems, tileJson, overviewJson, indexJson, firstLoad } = mapFiles(map);
if (budgetProblems.length) {
  console.error(`data:build: ${budgetProblems.length} map size budget(s) broken:`);
  for (const p of budgetProblems.slice(0, 20)) console.error(`  ${p}`);
  process.exit(1);
}

// Places for the trip planner (B45; US B78): also committed, one file per country; a missing file fails the build.
const placesFiles = COUNTRIES.map((cc) => {
  const path = join(root, 'data', 'imported', 'geonames', `places-${cc}.json`);
  if (!existsSync(path)) {
    console.error(`data:build: data/imported/geonames/places-${cc}.json is missing; run npm run fetch:geonames -- --country=${cc}.`);
    process.exit(1);
  }
  return { cc, file: JSON.parse(readFileSync(path, 'utf8')) as { places: Place[] } };
});

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
  writeFileSync(join(out, 'map', 'meta.json'), JSON.stringify(map.meta));
  console.log(`data:build: map ${map.meta.counts.l3} L3 + ${map.meta.counts.l2} L2-only stations → public/data/map/`);
  // B78 overview, tiles and index.
  const kb = (n: number) => `${(n / 1e3).toFixed(0)} KB`;
  for (const lv of [3, 2] as const) writeFileSync(join(out, 'map', `o${lv}.json`), overviewJson[lv]);
  mkdirSync(join(out, 'map', 'tiles', '3'), { recursive: true });
  mkdirSync(join(out, 'map', 'tiles', '2'), { recursive: true });
  writeFileSync(join(out, 'map', 'tiles', 'index.json'), indexJson);
  for (const [path, json] of tileJson) writeFileSync(join(out, 'map', path), json);
  const tileSizes = (lv: 3 | 2) => [...tileJson].filter(([p]) => p.startsWith(`tiles/${lv}/`)).map(([, j]) => j.length);
  const largest = (lv: 3 | 2) => Math.max(...tileSizes(lv));
  const gz = (s: string) => kb(gzipSync(s).length);
  console.log(
    `data:build: overview o3 ${kb(overviewJson[3].length)} (${gz(overviewJson[3])} gz), o2 ${kb(overviewJson[2].length)} (${gz(overviewJson[2])} gz) · tiles: L3 ${map.tiles[3].size} (largest ${kb(largest(3))}), L2 ${map.tiles[2].size} (largest ${kb(largest(2))}) · index ${kb(indexJson.length)} · first load ${kb(firstLoad)}`,
  );
  if (map.ocm) console.log(`data:build: Open Charge Map adds ${map.ocm.kept.length} stations (duplicates of AFDC removed: ${JSON.stringify(map.ocm.dropped)})`);
}

// Trip planner places (B45; US B78): short-key rows for From/To suggestions, from the committed GeoNames imports.
// The US file stays under about 1 MB raw (DESIGN-7 D5); a bigger one fails the build.
const MAX_PLACES_BYTES = 1_000_000;
rmSync(join(out, 'places.json'), { force: true }); // the one-country file before B78
for (const { cc, file } of placesFiles) {
  const json = JSON.stringify(toPlaceRows(file.places));
  if (Buffer.byteLength(json) > MAX_PLACES_BYTES) {
    console.error(`data:build: places-${cc}.json is ${(Buffer.byteLength(json) / 1e6).toFixed(2)} MB, over the 1 MB budget; raise the population floor in scripts/lib/geonames.ts.`);
    process.exit(1);
  }
  writeFileSync(join(out, `places-${cc}.json`), json);
  console.log(`data:build: ${file.places.length} places → public/data/places-${cc}.json · ${(Buffer.byteLength(json) / 1e6).toFixed(2)} MB (${(gzipSync(json).length / 1e6).toFixed(2)} MB gz)`);
}
