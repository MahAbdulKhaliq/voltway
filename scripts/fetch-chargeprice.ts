// `npm run fetch:chargeprice`: downloads the archived Chargeprice "Open EV Data" file
// (KilowattApp fork, read-only since 2025) at a pinned commit into sources/chargeprice/.
// The archive will not change, so the commit is fixed in code.

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'KilowattApp/open-ev-data';
const COMMIT = '32d7dc59e7b8b7391572ca1e132a1517be9a3b5e'; // last commit, 2025-04-12 (repo archived)
const FILE = 'data/ev-data.json';
const OUT_DIR = join(process.cwd(), 'sources', 'chargeprice');

async function main() {
  const url = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/${FILE}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'voltway-data-fetch' } });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const parsed = JSON.parse(bytes.toString('utf8')) as { data?: unknown[]; meta?: { updated_at?: string } };
  if (!Array.isArray(parsed.data)) throw new Error('Downloaded JSON has no "data" array');

  mkdirSync(OUT_DIR, { recursive: true });
  for (const old of readdirSync(OUT_DIR)) rmSync(join(OUT_DIR, old));
  writeFileSync(join(OUT_DIR, 'ev-data.json'), bytes);
  const meta = {
    repo: REPO,
    commit: COMMIT,
    path: FILE,
    tree_page: `https://github.com/${REPO}/tree/${COMMIT}`,
    data_updated_at: parsed.meta?.updated_at?.slice(0, 10),
    file: 'ev-data.json',
    fetched_on: new Date().toISOString().slice(0, 10),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    vehicle_count: parsed.data.length,
    suggested_source_id: 'src-chargeprice-archive-2025-04',
  };
  writeFileSync(join(OUT_DIR, 'FETCHED.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`fetch:chargeprice: saved ${FILE} @ ${COMMIT.slice(0, 7)} (${parsed.data.length} vehicles)`);
}

main().catch((e) => {
  console.error(`fetch:chargeprice: ${(e as Error).message}`);
  process.exit(1);
});
