// `npm run validate`: checks every data file against schema/ and the cross-file rules.
// Exits non-zero on any error, which stops `npm run build` and the CI job.

import { validateRepo } from './lib/validate-data.ts';

const { errors, counts } = validateRepo(process.cwd());
const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ');

if (errors.length > 0) {
  console.error(`validate: ${errors.length} error(s)\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`validate: OK (${summary})`);
