// `npm run fetch:ocm [-- --country=us]`: downloads one country's open-licensed Open Charge Map records
// we use (docs/plan/DESIGN-6.md P1, owner decision B77; the US since B78, DESIGN-7 D1) into
// sources/ocm-<cc>/ (Canada when no country is given):
//   poi-raw.json        the POIs (git-ignored, re-downloaded monthly)
//   referencedata.json  OCM's lookup lists (operators, connection types)
//   FETCHED.json        where, when, checksum, counts and how many requests were made
//
// OCM's fair-use rules: no repeated duplicate queries, throttle requests, set a custom user agent,
// key as the X-API-Key header; OCM may ban excessive callers. So this script:
//   - asks only for what we use (one country; providers 1, 24, 45; compact; no comments),
//   - pages by id like OCM's own export (sortby=id_asc&greaterthanid=…),
//   - asks for 5,000 records a page (owner, 2026-11-18), waits 3 s between requests, never retries,
//     and stops after a page cap per country (Canada 2, US 5) rather than keep calling OCM,
//   - is run once a month by the charger refresh workflow, never by the site.
// Needs OCM_API_KEY: a GitHub Actions secret in CI, or the local git-ignored .env file.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OCM_PROVIDER_IDS } from './lib/ocm.ts';
import { countryArg, rawDir, type Country } from './lib/countries.ts';

export const OCM_API = 'https://api.openchargemap.io/v3';
export const PAGE_SIZE = 5000;
/**
 * Pages before a country's pull stops: Canada had ~2,900 records and the US 13,232 in the 2026-11-18
 * survey, so 1 and 3 pages today (5 requests a month with one reference-data download, shared by
 * both countries: QA 2026-11-18, S2), and never more than 2 + 5 pages + 2 = 9, inside the cap of 10
 * (DESIGN-7 D1).
 */
export const MAX_PAGES: Record<Country, number> = { ca: 2, us: 5 };
export const PAUSE_MS = 3000;
export const USER_AGENT = 'Voltway-charger-refresh/1.0 (+https://github.com/MahAbdulKhaliq/voltway)';
export const RAW_FILE = 'poi-raw.json';
export const REF_FILE = 'referencedata.json';
/** Another country's reference data younger than this is reused, not asked for again (same query). */
export const REF_REUSE_MS = 12 * 3600 * 1000;

/** A recent reference-data file from the other country's pull this run, or null. */
export function recentRefFile(root: string, country: Country, now = Date.now()): string | null {
  for (const other of ['ca', 'us'] as const) {
    if (other === country) continue;
    const path = join(rawDir(root, 'ocm', other), REF_FILE);
    if (existsSync(path) && now - statSync(path).mtimeMs < REF_REUSE_MS) return path;
  }
  return null;
}

/** The POI query for one page: everything after `greaterThanId`, oldest id first. */
export function poiQuery(greaterThanId: number, country: Country = 'ca'): string {
  const q = new URLSearchParams({
    output: 'json',
    countrycode: country.toUpperCase(),
    dataproviderid: OCM_PROVIDER_IDS.join(','),
    compact: 'true',
    verbose: 'false',
    includecomments: 'false',
    sortby: 'id_asc',
    greaterthanid: String(greaterThanId),
    maxresults: String(PAGE_SIZE),
  });
  return `${OCM_API}/poi?${q}`;
}

export type Fetch = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface PullResult {
  pois: { ID: number }[];
  requests: number;
}

/**
 * Pages through the POIs. One attempt per page: any failure throws (the workflow then keeps last
 * month's data). Stops when a page comes back short, or throws after MAX_PAGES full pages.
 */
export async function pullPois(key: string, fetchFn: Fetch, sleep: (ms: number) => Promise<void>, country: Country = 'ca'): Promise<PullResult> {
  const maxPages = MAX_PAGES[country];
  const pois: { ID: number }[] = [];
  let after = 0;
  let requests = 0;
  for (let page = 0; page < maxPages; page++) {
    if (requests > 0) await sleep(PAUSE_MS);
    const res = await fetchFn(poiQuery(after, country), { headers: headers(key) });
    requests++;
    if (!res.ok) throw new Error(`OCM request failed: HTTP ${res.status}`);
    const body = JSON.parse(await res.text()) as unknown;
    if (!Array.isArray(body)) throw new Error('OCM response is not a list');
    const batch = body as { ID: number }[];
    if (batch.some((p, i) => typeof p?.ID !== 'number' || p.ID <= (i ? batch[i - 1].ID : after))) throw new Error('OCM response is not in id order');
    pois.push(...batch);
    if (batch.length < PAGE_SIZE) return { pois, requests };
    after = batch[batch.length - 1].ID;
  }
  throw new Error(`more than ${maxPages * PAGE_SIZE} records: stopping rather than keep calling OCM`);
}

export function headers(key: string): Record<string, string> {
  return { 'X-API-Key': key, 'User-Agent': USER_AGENT, Accept: 'application/json' };
}

function apiKey(): string {
  if (!process.env.OCM_API_KEY && existsSync('.env')) process.loadEnvFile('.env');
  const key = process.env.OCM_API_KEY?.trim();
  if (!key) throw new Error('OCM_API_KEY is not set (add it to .env locally, or as a GitHub Actions secret)');
  return key;
}

async function main() {
  const country = countryArg();
  const OUT_DIR = rawDir(process.cwd(), 'ocm', country);
  const key = apiKey();
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  // The pause also holds between two countries' runs, which the workflow starts back to back.
  await sleep(PAUSE_MS);
  const { pois, requests } = await pullPois(key, fetch, sleep, country);
  if (pois.length === 0) throw new Error('no records returned');
  // Reference data (operators etc.) is the same query for both countries: ask once a run.
  const reuse = recentRefFile(process.cwd(), country);
  let refText: string;
  if (reuse) {
    refText = readFileSync(reuse, 'utf8');
  } else {
    await sleep(PAUSE_MS);
    const refRes = await fetch(`${OCM_API}/referencedata?countryid=44`, { headers: headers(key) });
    if (!refRes.ok) throw new Error(`OCM reference data request failed: HTTP ${refRes.status}`);
    refText = await refRes.text();
  }
  const ref = JSON.parse(refText) as { Operators?: unknown[] };
  if (!Array.isArray(ref.Operators)) throw new Error('OCM reference data has no Operators list');

  const text = JSON.stringify(pois);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, RAW_FILE), text);
  writeFileSync(join(OUT_DIR, REF_FILE), refText);
  const meta = {
    api: OCM_API,
    query: poiQuery(0, country).replace(/greaterthanid=0/, 'greaterthanid=<last id>'),
    docs: 'https://github.com/openchargemap/ocm-docs/blob/master/Model/schema/ocm-openapi-spec.yaml',
    file: RAW_FILE,
    reference_file: REF_FILE,
    fetched_at: new Date().toISOString(),
    sha256: createHash('sha256').update(text).digest('hex'),
    bytes: Buffer.byteLength(text),
    poi_count: pois.length,
    requests: requests + (reuse ? 0 : 1),
    ...(reuse ? { reference_reused_from: reuse.replace(/\\/g, '/').split('/').slice(-2).join('/') } : {}),
  };
  writeFileSync(join(OUT_DIR, 'FETCHED.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`fetch:ocm ${country}: saved ${meta.poi_count} records in ${meta.requests} requests (${(meta.bytes / 1e6).toFixed(1)} MB)`);
}

// Run only when called as a script, so tests can import the helpers.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-ocm.ts')) {
  main().catch((e) => {
    console.error(`fetch:ocm: ${(e as Error).message}`);
    process.exit(1);
  });
}
