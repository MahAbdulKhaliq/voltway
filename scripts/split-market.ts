// `npx tsx scripts/split-market.ts <variant id> [...]` (B91, B96): splits a CA+US variant whose markets
// differ (e.g. charge port) into a Canada edition (keeps the id) and a US edition `<id>-us`.
// The US edition gets the US trim names and the EPA crosswalk rows; both keep the powertrain.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from './lib/csv.ts';

const root = process.cwd();
const cwFile = join(root, 'crosswalk/crosswalk.csv');
const cwText = readFileSync(cwFile, 'utf8');
const header = cwText.slice(0, cwText.indexOf('\n')).replace(/\r$/, '').split(',');
const rows = parseCsv(cwText);
for (const id of process.argv.slice(2)) {
  const file = join(root, 'data/variants', `${id}.json`);
  const usId = `${id}-us`;
  const usFile = join(root, 'data/variants', `${usId}.json`);
  if (!existsSync(file)) throw new Error(`No variant ${id}`);
  if (existsSync(usFile)) { console.log(`${usId} exists, skipped`); continue; }
  const v = JSON.parse(readFileSync(file, 'utf8'));
  if (!(v.markets ?? []).includes('CA') || !v.markets.includes('US')) throw new Error(`${id} is not a CA+US variant`);
  const pick = (m: 'CA' | 'US') => ({
    ...v, id: m === 'CA' ? id : usId, markets: [m],
    name: m === 'CA' ? v.name : (v.trims?.[0]?.names?.US ?? v.name),
    trims: v.trims.map((t: any) => ({ ...t, names: t.names?.[m] ? { [m]: t.names[m] } : t.names })),
  });
  writeFileSync(file, JSON.stringify(pick('CA'), null, 2) + '\n');
  writeFileSync(usFile, JSON.stringify(pick('US'), null, 2) + '\n');
  let moved = 0;
  for (const r of rows) if (r.our_variant_id === id && r.source === 'epa') { r.our_variant_id = usId; moved++; }
  console.log(`split ${id} → ${usId} (${moved} EPA rows moved)`);
}
writeFileSync(cwFile, toCsv(header, rows));
