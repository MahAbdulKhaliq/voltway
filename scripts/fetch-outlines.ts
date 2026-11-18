// `npm run fetch:outlines`: downloads Natural Earth's 1:10m Admin 0 countries (public domain), keeps
// Canada and the US south of 60.5° N (north of it a simple rule applies, src/lib/country.ts),
// simplifies them (scripts/lib/outline.ts) and writes data/imported/naturalearth/{ca,us}.json for the
// trip function's "a trip stays in its start's country" check (B74, B78; DESIGN-7 D4). Refreshed by
// hand when needed; no key. The download is not kept: each file records its URL, date and checksum.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BORDER_TOLERANCE_DEG, COAST_TOLERANCE_DEG, simplifyOutline } from './lib/outline.ts';
import type { CountryCode, Ring } from '../src/lib/country.ts';

export const NE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson';
const OUT_DIR = join(process.cwd(), 'data', 'imported', 'naturalearth');

/**
 * Each country's Natural Earth codes, and the neighbours whose shared points are its land border.
 * Natural Earth lists Puerto Rico, the Virgin Islands, Guam, the Northern Marianas and American Samoa
 * as their own entries; AFDC lists their chargers as US ones, so they are part of the US outline.
 */
export const COUNTRY_OUTLINES: Record<CountryCode, { a3: string[]; neighbours: string[] }> = {
  ca: { a3: ['CAN'], neighbours: ['USA', 'FRA'] }, // FRA: Saint-Pierre-et-Miquelon
  us: { a3: ['USA', 'PRI', 'VIR', 'GUM', 'MNP', 'ASM'], neighbours: ['CAN', 'MEX'] },
};

type Feature = { properties: { ADM0_A3?: string }; geometry: { type: string; coordinates: Ring[][] | Ring[] } };
const polygonsOf = (f: Feature) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];

async function main() {
  const res = await fetch(NE_URL);
  if (!res.ok) throw new Error(`Natural Earth download failed: HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const json = JSON.parse(raw.toString('utf8')) as { features: Feature[] };
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [country, { a3, neighbours }] of Object.entries(COUNTRY_OUTLINES) as [CountryCode, (typeof COUNTRY_OUTLINES)['ca']][]) {
    const features = a3.map((code) => {
      const f = json.features.find((x) => x.properties.ADM0_A3 === code);
      if (!f) throw new Error(`${code} not found in the download`);
      return f;
    });
    // Points a country shares with a neighbour are its land border.
    const shared = new Set<string>();
    for (const f of json.features.filter((x) => neighbours.includes(x.properties.ADM0_A3 ?? ''))) {
      for (const p of polygonsOf(f)) for (const r of p) for (const q of r) shared.add(`${q[0]},${q[1]}`);
    }
    const polys = features.flatMap(polygonsOf);
    const { polygons: outline, border } = simplifyOutline(polys, (q) => shared.has(`${q[0]},${q[1]}`));
    const points = outline.flat().reduce((n, r) => n + r.length, 0);
    // A healthy outline has dozens of polygons and thousands of points.
    if (outline.length < 20 || points < 2000) throw new Error(`${country}: only ${outline.length} polygons / ${points} points; check the download`);
    const out = {
      source: 'naturalearth-admin0-10m',
      source_id: 'src-naturalearth',
      country,
      url: NE_URL,
      fetched_at: new Date().toISOString(),
      sha256,
      tolerance_deg: { border: BORDER_TOLERANCE_DEG, coast: COAST_TOLERANCE_DEG },
      polygons: outline,
      border,
    };
    const text = JSON.stringify(out);
    writeFileSync(join(OUT_DIR, `${country}.json`), text);
    console.log(`fetch:outlines ${country}: ${outline.length} polygons, ${points} points (from ${polys.length} polygons), ${(text.length / 1e3).toFixed(0)} KB`);
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-outlines.ts')) {
  main().catch((e) => {
    console.error(`fetch:outlines: ${(e as Error).message}`);
    process.exit(1);
  });
}
