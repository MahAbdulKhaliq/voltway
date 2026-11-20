// `npm run check:required` (B96): lists every car still missing a required charging/mapping figure,
// grouped by powertrain. Exits 1 if any. Run `npm run data:build` first.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { missingRequired } from './lib/required-fields.ts';

const dir = join(process.cwd(), 'public/data');
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')) as { id: string }[];
const byPt = new Map<string, { cars: string[]; fields: Set<string> }>();
const perField: Record<string, number> = {};
let cars = 0;
for (const e of index) {
  const car = JSON.parse(readFileSync(join(dir, 'cars', `${e.id}.json`), 'utf8'));
  const miss = missingRequired(car);
  if (!miss.length) continue;
  cars++;
  for (const m of miss) perField[m] = (perField[m] ?? 0) + 1;
  const key = car.powertrain_id ?? car.id;
  const g = byPt.get(key) ?? { cars: [], fields: new Set<string>() };
  g.cars.push(car.id); miss.forEach((m) => g.fields.add(m)); byPt.set(key, g);
}
if (!cars) { console.log(`check:required: OK, all ${index.length} cars have every required figure`); process.exit(0); }
console.log(`check:required: ${cars} of ${index.length} cars miss a required figure (${byPt.size} powertrains)`);
console.log('  per field:', JSON.stringify(perField));
if (process.argv.includes('--list')) for (const [pt, g] of [...byPt].sort()) console.log(`  ${pt}: ${[...g.fields].join(', ')} (${g.cars.length} cars)`);
process.exit(1);
