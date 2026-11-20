// `npm run validate`: checks every data file against schema/ and the cross-file rules.
// Exits non-zero on any error, which stops `npm run build` and the CI job.

import { buildCars } from './lib/build.ts';
import { missingRequired } from './lib/required-fields.ts';
import { validateRepo } from './lib/validate-data.ts';

const { errors, counts } = validateRepo(process.cwd());
const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ');

// B96 (owner 2026-11-19): no unknowns on the charging and mapping figures. Every built car must have
// all required fields (`npm run check:required -- --list` shows the gaps by powertrain).
// B114 (owner 2026-11-20): warnings, not errors, until checklist 9.20b fills the remaining gaps;
// set B96_STRICT=1 to make them errors again.
const strict = process.env.B96_STRICT === '1';
const gaps: string[] = [];
if (!errors.length) {
  for (const car of buildCars(process.cwd()).cars) {
    const miss = missingRequired(car);
    if (miss.length) gaps.push(`${car.id}: missing required ${miss.join(', ')} (B96)`);
  }
}
if (strict) errors.push(...gaps);

if (errors.length > 0) {
  console.error(`validate: ${errors.length} error(s)\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
if (gaps.length) {
  console.warn(`validate: ${gaps.length} car(s) still miss B96 required figures (warnings until 9.20b, B114)\n`);
  for (const g of gaps) console.warn(`  ⚠ ${g}`);
}
console.log(`validate: OK (${summary}${gaps.length ? `; ${gaps.length} B96 gaps shown as warnings` : '; every car has the B96 required figures'})`);
