// `npm run fetch:epa`: downloads fueleconomy.gov's vehicles.csv.zip (US EPA / DOE ratings, US government
// data) and keeps only the battery-electric rows from 2011 on (B90) in sources/epa/, with FETCHED.json.
// The full file is ~22 MB of mostly gasoline cars; the EV extract is small enough to commit.

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from './lib/csv.ts';
import { checkEpaColumns, EPA_FIRST_YEAR, isEpaBev, unzipSingle } from './lib/epa.ts';

const URL_ZIP = 'https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip';
const OUT_DIR = join(process.cwd(), 'sources', 'epa');
const FILE = `fueleconomy-ev-${EPA_FIRST_YEAR}plus.csv`;

async function main() {
  const res = await fetch(URL_ZIP, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  const { name, data } = unzipSingle(zip);
  const text = data.toString('utf8');
  const header = text.slice(0, text.indexOf('\n')).replace(/\r$/, '').split(',');
  checkEpaColumns(header);
  const ev = parseCsv(text).filter(isEpaBev);
  if (ev.length < 500) throw new Error(`Only ${ev.length} EV rows; the file may have changed.`);
  const csv = toCsv(header, ev);

  mkdirSync(OUT_DIR, { recursive: true });
  for (const old of readdirSync(OUT_DIR)) rmSync(join(OUT_DIR, old));
  writeFileSync(join(OUT_DIR, FILE), csv);
  const fetched = new Date().toISOString().slice(0, 10);
  const meta = {
    url: URL_ZIP,
    zip_entry: name,
    file: FILE,
    rows: ev.length,
    fetched_on: fetched,
    zip_sha256: createHash('sha256').update(zip).digest('hex'),
    sha256: createHash('sha256').update(csv).digest('hex'),
    suggested_source_id: `src-epa-fueleconomy-${fetched.slice(0, 7)}`,
  };
  writeFileSync(join(OUT_DIR, 'FETCHED.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`fetch:epa: ${ev.length} battery-electric rows (${EPA_FIRST_YEAR}+) → sources/epa/${FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
