// `npx tsx scripts/check-sources.ts <body.md>` (8.1, run by .github/workflows/data-refresh.yml
// after fetch:nrcan and fetch:openev). Compares each fresh download in sources/ with the copy
// committed at HEAD by checksum. Unchanged: the folder is put back exactly as committed, so a
// new fetch date alone never makes a pull request. Changed: the new copy stays and a summary of
// new / removed / changed cars is written to <body.md> for the pull request.
// Prints `changed=true|false` to $GITHUB_OUTPUT when set. Importing stays a person's step.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describeDiff, diffNrcan, diffOpenEv, type RowDiff } from './lib/source-diff.ts';

interface Fetched {
  file: string;
  sha256: string;
  suggested_source_id: string;
  resource_name?: string;
  last_modified?: string;
  tag?: string;
  published_at?: string;
}

const root = process.cwd();
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const committed = (path: string): string | null => {
  try {
    return git('show', `HEAD:${path}`);
  } catch {
    return null; // not committed yet
  }
};

const SOURCES: { dir: 'nrcan' | 'openev'; title: string; diff: (before: string | null, after: string) => RowDiff; edition: (m: Fetched) => string }[] = [
  { dir: 'nrcan', title: 'NRCan Fuel Consumption Ratings (BEV)', diff: diffNrcan, edition: (m) => `${m.resource_name ?? m.file}, last modified ${m.last_modified ?? '?'}` },
  { dir: 'openev', title: 'OpenEV Data (North American vehicles)', diff: diffOpenEv, edition: (m) => `release ${m.tag ?? m.file}, published ${m.published_at ?? '?'}` },
];

const sections: string[] = [];
const nextSteps: string[] = [];
for (const s of SOURCES) {
  const metaPath = `sources/${s.dir}/FETCHED.json`;
  const now = JSON.parse(readFileSync(join(root, metaPath), 'utf8')) as Fetched;
  const beforeText = committed(metaPath);
  const before = beforeText ? (JSON.parse(beforeText) as Fetched) : null;
  if (before && before.sha256 === now.sha256) {
    git('checkout', 'HEAD', '--', `sources/${s.dir}`);
    git('clean', '-fdq', '--', `sources/${s.dir}`);
    console.log(`check-sources: ${s.dir} unchanged (${now.sha256.slice(0, 12)})`);
    continue;
  }
  const oldRaw = before ? committed(`sources/${s.dir}/${before.file}`) : null;
  const newRaw = readFileSync(join(root, 'sources', s.dir, now.file), 'utf8');
  const d = s.diff(oldRaw, newRaw);
  console.log(`check-sources: ${s.dir} changed: ${d.added.length} new, ${d.removed.length} removed, ${d.changed.length} changed`);
  sections.push(`${describeDiff(s.title, d)}\nWas: ${before ? s.edition(before) : 'nothing committed'}. Now: ${s.edition(now)}.\n`);
  nextSteps.push(`- **${s.dir}:** add \`data/sources/${now.suggested_source_id}.json\` (copy the previous record, update title, URL and dates) if it doesn't exist, then \`npm run import:${s.dir}\`.`);
}

const changed = sections.length > 0;
if (changed) {
  const body = [
    'Automated monthly check (`.github/workflows/data-refresh.yml`): an upstream dataset no longer matches the committed copy in `sources/`. This pull request only updates the raw copy. **Nothing goes live until a person reviews it** (automation suggests, a person approves).',
    ...sections,
    '### To finish',
    ...nextSteps,
    '- `npm run suggest:matches` for any new cars, confirm matches in the crosswalk, then `npm run validate && npm test && npm run build`, and review the `data/imported/` diff before merging.',
    '- CI does not start on its own for pull requests opened by GitHub Actions: push a commit (or close and reopen) to run it.',
  ].join('\n\n');
  writeFileSync(process.argv[2] ?? join(root, 'refresh-body.md'), body + '\n');
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
console.log(`check-sources: ${changed ? 'changes found' : 'no changes'}`);
