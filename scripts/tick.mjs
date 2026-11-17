#!/usr/bin/env node
// Ticks one item in docs/plan/CHECKLIST.md and appends a dated "Done" note to it.
// Usage: node scripts/tick.mjs <item-id> "<what was verified>"
//   e.g. node scripts/tick.mjs 3.13 "browser: the map panel shows the link; tests: tripToHref"
// The id matches the item's bold label ("**[3] 3.13 …**" or "**3.13 …**"). Fails loudly when the
// item is missing, already ticked, or the id matches more than one item.

import { readFileSync, writeFileSync } from 'node:fs';

const [id, note] = process.argv.slice(2);
if (!id || !note) {
  console.error('Usage: node scripts/tick.mjs <item-id> "<what was verified>"');
  process.exit(2);
}

const path = 'docs/plan/CHECKLIST.md';
const lines = readFileSync(path, 'utf8').split('\n');
const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = new RegExp(`^- \\[( |x)\\] \\*\\*(?:\\[[^\\]]+\\] )?${esc}\\b`);
const hits = lines.map((l, i) => (label.test(l) ? i : -1)).filter((i) => i >= 0);

if (hits.length !== 1) {
  console.error(hits.length ? `"${id}" matches ${hits.length} items; be more specific.` : `No checklist item "${id}".`);
  process.exit(1);
}
const start = hits[0];
if (lines[start].startsWith('- [x]')) {
  console.error(`Item ${id} is already ticked.`);
  process.exit(1);
}

// The item runs until the next item, heading or blank line.
let end = start;
while (end + 1 < lines.length && !/^(- \[|#|\s*$)/.test(lines[end + 1])) end++;

const date = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
lines[start] = lines[start].replace('- [ ]', '- [x]');
lines[end] = `${lines[end]} *(Done ${date}: ${note.trim().replace(/\.$/, '')}.)*`;
writeFileSync(path, lines.join('\n'));
console.log(`Ticked ${id}:\n${lines.slice(start, end + 1).join('\n').slice(0, 400)}`);
