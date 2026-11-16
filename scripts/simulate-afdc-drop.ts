// Test helper for the charger-refresh workflow's blocked path (CHECKLIST M5):
// removes a share of stations from the raw AFDC pull, as if the source had lost them,
// so the sanity checks fail. Only run by a manual workflow run with "simulate_drop" ticked.
// Usage: tsx scripts/simulate-afdc-drop.ts [share=0.15]

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const share = Number(process.argv[2] ?? '0.15');
const rawDir = join(process.cwd(), 'sources', 'afdc-ca');
const meta = JSON.parse(readFileSync(join(rawDir, 'FETCHED.json'), 'utf8')) as { file: string };
const path = join(rawDir, meta.file);
const raw = JSON.parse(readFileSync(path, 'utf8')) as { fuel_stations: unknown[] };
const before = raw.fuel_stations.length;
raw.fuel_stations = raw.fuel_stations.slice(0, Math.floor(before * (1 - share)));
writeFileSync(path, JSON.stringify(raw));
console.log(`simulate-afdc-drop: ${before} → ${raw.fuel_stations.length} raw stations (removed ${(share * 100).toFixed(0)} %)`);
