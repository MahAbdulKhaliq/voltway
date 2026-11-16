// `npm run fetch:openev [tag]`: downloads an OpenEV Data release's JSON asset into
// sources/openev/, with FETCHED.json (tag, date, sha256). Defaults to the latest release.
// Releases are pinned: importing a new one is a deliberate, reviewable change.

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'open-ev-data/open-ev-data-dataset';
const OUT_DIR = join(process.cwd(), 'sources', 'openev');

interface Release {
  tag_name: string;
  html_url: string;
  published_at: string;
  assets: { name: string; browser_download_url: string; size: number }[];
}

async function main() {
  const tag = process.argv[2];
  const api = tag
    ? `https://api.github.com/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`
    : `https://api.github.com/repos/${REPO}/releases/latest`;
  // In GitHub Actions the token avoids the shared runners' anonymous rate limit.
  const auth: Record<string, string> = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const res = await fetch(api, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'voltway-data-fetch', ...auth } });
  if (!res.ok) throw new Error(`Release lookup failed: HTTP ${res.status}`);
  const release = (await res.json()) as Release;

  const asset = release.assets.find((a) => /^open-ev-data-.*\.json$/.test(a.name));
  if (!asset) throw new Error(`Release ${release.tag_name} has no open-ev-data-*.json asset`);

  const file = await fetch(asset.browser_download_url, { redirect: 'follow', headers: { 'User-Agent': 'voltway-data-fetch' } });
  if (!file.ok) throw new Error(`Download failed: HTTP ${file.status}`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const parsed = JSON.parse(bytes.toString('utf8')) as { vehicles?: unknown[] };
  if (!Array.isArray(parsed.vehicles)) throw new Error('Downloaded JSON has no "vehicles" array; the format may have changed');

  mkdirSync(OUT_DIR, { recursive: true });
  for (const old of readdirSync(OUT_DIR)) rmSync(join(OUT_DIR, old));
  writeFileSync(join(OUT_DIR, asset.name), bytes);

  const slug = release.tag_name.replace(/^v/, '').replace(/\./g, '-');
  const meta = {
    repo: REPO,
    tag: release.tag_name,
    release_page: release.html_url,
    published_at: release.published_at.slice(0, 10),
    file: asset.name,
    fetched_on: new Date().toISOString().slice(0, 10),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    vehicle_count: parsed.vehicles.length,
    suggested_source_id: `src-openev-v${slug}`,
  };
  writeFileSync(join(OUT_DIR, 'FETCHED.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`fetch:openev: saved ${asset.name} (${parsed.vehicles.length} vehicles, ${release.tag_name})`);
  console.log(`  source id for this release: ${meta.suggested_source_id}`);
}

main().catch((e) => {
  console.error(`fetch:openev: ${(e as Error).message}`);
  process.exit(1);
});
