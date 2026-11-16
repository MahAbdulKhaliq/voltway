// `npm run data:build`: runs the data build (scripts/lib/build.ts) and writes
//   public/data/index.json          small list for browse/search
//   public/data/cars/<id>.json      one detail file per variant
// public/data/ is generated on every build (and git-ignored); the source of truth is data/.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildCars } from './lib/build.ts';
import { outputProblems } from './lib/output-check.ts';

const root = process.cwd();
const out = join(root, 'public', 'data');
const { cars, index, estimates, report } = buildCars(root);

// Fail the build on any unsourced figure in the output, not only in the input (rule: no bare numbers).
const problems = cars.flatMap(outputProblems);
if (problems.length) {
  console.error(`data:build: ${problems.length} unsourced figure(s) in the output:`);
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
