// `npm run fetch:canada`: downloads Natural Earth's 1:10m Admin 0 countries (public domain),
// keeps Canada south of 60.5° N, simplifies it (scripts/lib/outline.ts) and writes
// data/imported/naturalearth/canada.json for the trip function's "outside Canada" check
// (B74, DESIGN-5 §2.3). Refreshed by hand when needed; no key. The download is not kept:
// the committed file records its URL, date and checksum.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BORDER_TOLERANCE_DEG, COAST_TOLERANCE_DEG, simplifyOutline } from './lib/outline.ts';
import type { Ring } from '../src/lib/canada.ts';

export const NE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson';
const OUT_DIR = join(process.cwd(), 'data', 'imported', 'naturalearth');

async function main() {
  const res = await fetch(NE_URL);
  if (!res.ok) throw new Error(`Natural Earth download failed: HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  const json = JSON.parse(raw.toString('utf8')) as { features: { properties: { ADM0_A3?: string }; geometry: { type: string; coordinates: Ring[][] | Ring[] } }[] };
  const can = json.features.find((f) => f.properties.ADM0_A3 === 'CAN');
  if (!can) throw new Error('Canada not found in the download');
  // Points Canada shares with the US (and Saint-Pierre-et-Miquelon) are the land border.
  const shared = new Set<string>();
  for (const f of json.features.filter((x) => x.properties.ADM0_A3 === 'USA' || x.properties.ADM0_A3 === 'FRA')) {
    const ps = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
    for (const p of ps) for (const r of p) for (const q of r) shared.add(`${q[0]},${q[1]}`);
  }
  const polys = (can.geometry.type === 'Polygon' ? [can.geometry.coordinates] : can.geometry.coordinates) as Ring[][];
  const { polygons: outline, border } = simplifyOutline(polys, (q) => shared.has(`${q[0]},${q[1]}`));
  const points = outline.flat().reduce((n, r) => n + r.length, 0);
  // A healthy outline has hundreds of polygons and thousands of points.
  if (outline.length < 50 || points < 2000) throw new Error(`only ${outline.length} polygons / ${points} points; check the download`);
  const out = {
    source: 'naturalearth-admin0-10m',
    source_id: 'src-naturalearth',
    url: NE_URL,
    fetched_at: new Date().toISOString(),
    sha256: createHash('sha256').update(raw).digest('hex'),
    tolerance_deg: { border: BORDER_TOLERANCE_DEG, coast: COAST_TOLERANCE_DEG },
    polygons: outline,
    border,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'canada.json'), JSON.stringify(out));
  console.log(`fetch:canada: ${outline.length} polygons, ${points} points (from ${polys.length} polygons)`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-canada-outline.ts')) {
  main().catch((e) => {
    console.error(`fetch:canada: ${(e as Error).message}`);
    process.exit(1);
  });
}
