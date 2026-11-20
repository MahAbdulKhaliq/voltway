// `npm run validate`: checks every data file against schema/ and the cross-file rules.
// Exits non-zero on any error, which stops `npm run build` and the CI job.

import { buildCars } from './lib/build.ts';
import { missingRequired } from './lib/required-fields.ts';
import { validateRepo } from './lib/validate-data.ts';

const { errors, counts } = validateRepo(process.cwd());
const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ');

// B96 (owner 2026-11-19): no unknowns on the charging and mapping figures. Every built car must have
// all required fields (`npm run check:required -- --list` shows the gaps by powertrain).
if (!errors.length) {
  for (const car of buildCars(process.cwd()).cars) {
    const miss = missingRequired(car);
    if (miss.length) errors.push(`${car.id}: missing required ${miss.join(', ')} (B96)`);
  }
}

if (errors.length > 0) {
  console.error(`validate: ${errors.length} error(s)\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`validate: OK (${summary}; every car has the B96 required figures)`);
