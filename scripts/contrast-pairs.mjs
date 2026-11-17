// Lists colour-token pairs used together in src/styles/global.css (a rule that sets both `color`
// and a background from tokens) that tests/contrast.test.ts doesn't cover yet, with their contrast
// in both themes. Advisory: run it before shipping a UI item (ship-item step 1) and add the real
// text/background pairs to PAIRS in the test. Always exits 0.
//   node scripts/contrast-pairs.mjs

import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const test = readFileSync(new URL('../tests/contrast.test.ts', import.meta.url), 'utf8');

// Tokens, read the same way the test reads them.
const tokens = (block) => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
const blockAt = (start) => css.slice(start, css.indexOf('}', start));
const light = tokens(blockAt(css.indexOf(':root {')));
const dark = tokens(blockAt(css.indexOf(':root[data-theme="dark"] {')));

// WCAG 2.x contrast (same formula as tests/contrast-util.ts).
const lum = (hex) => {
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Pairs the test already checks: ['fg', 'bg', n] literals, plus the car-1..4 pairs it generates.
const covered = new Set([...test.matchAll(/\['([\w-]+)',\s*'([\w-]+)',\s*[\d.]+\]/g)].map((m) => `${m[1]}|${m[2]}`));
for (const n of [1, 2, 3, 4]) for (const bg of ['surface', 'bg']) covered.add(`car-${n}|${bg}`);

// Rules that set a text colour and a background from tokens.
const used = new Map(); // "fg|bg" -> selectors
const css2 = css.replace(/\/\*[\s\S]*?\*\//g, '');
for (const m of css2.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selector = m[1].trim().replace(/\s+/g, ' ');
  if (selector.startsWith(':root') || selector.startsWith('@')) continue;
  const body = m[2];
  const fg = /(?:^|;|\s)color:\s*var\(--([\w-]+)\)/.exec(body)?.[1];
  const bg = /background(?:-color)?:\s*var\(--([\w-]+)\)/.exec(body)?.[1];
  if (!fg || !bg) continue;
  const key = `${fg}|${bg}`;
  if (!used.has(key)) used.set(key, []);
  used.get(key).push(selector);
}

const missing = [...used].filter(([key]) => !covered.has(key));
if (missing.length === 0) {
  console.log(`All ${used.size} colour pairs set together in global.css are covered by tests/contrast.test.ts.`);
} else {
  console.log(`${missing.length} colour pair(s) used in global.css but not in tests/contrast.test.ts PAIRS:\n`);
  for (const [key, selectors] of missing) {
    const [fg, bg] = key.split('|');
    const ratio = (t) => (t[fg] && t[bg] ? contrast(t[fg], t[bg]).toFixed(2) : 'n/a');
    console.log(`  ['${fg}', '${bg}', 4.5]   light ${ratio(light)}:1 · dark ${ratio(dark)}:1`);
    console.log(`     used by: ${selectors.slice(0, 3).join(' | ')}${selectors.length > 3 ? ` (+${selectors.length - 3} more)` : ''}`);
  }
  console.log('\nAdd the ones that are text on a background (4.5) or control edges/marks (3) to PAIRS.');
}
