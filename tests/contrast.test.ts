// Owner decisions B20 and B53 (Road Paint): both themes must pass WCAG 2.x AA. Reads the colour tokens straight
// from global.css so a palette change that breaks contrast fails CI.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrast } from './contrast-util.ts';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
}
const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {'))));
const darkStart = css.indexOf(':root[data-theme="dark"] {');
const dark = tokens(css.slice(darkStart, css.indexOf('}', darkStart)));
const mediaStart = css.indexOf(':root:not([data-theme="light"]) {');
const darkMedia = tokens(css.slice(mediaStart, css.indexOf('}', mediaStart)));

// Text needs 4.5:1; control outlines and chart lines (non-text UI) need 3:1.
const PAIRS: [string, string, number][] = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5],
  ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['muted', 'surface-2', 4.5],
  ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['accent', 'surface-2', 4.5], ['accent', 'accent-soft', 4.5],
  ['accent-ink', 'accent', 4.5],
  // Road Paint: the label on a filled yellow button; the stop bar and the painted line on a panel.
  ['paint-ink', 'paint', 4.5], ['paint', 'band', 3], ['band', 'bg', 1], ['paint-edge', 'surface', 3], ['paint-edge', 'bg', 3], ['paint-edge', 'surface-2', 3], ['mark', 'surface', 3], ['mark', 'bg', 3],
  ['warn', 'surface', 4.5], ['warn', 'bg', 4.5], ['warn', 'warn-soft', 4.5], ['text', 'warn-soft', 4.5],
  ['estimated', 'surface', 4.5], ['estimated', 'estimated-soft', 4.5], ['text', 'estimated-soft', 4.5],
  ['unknown', 'surface', 4.5], ['unknown', 'surface-2', 4.5],
  ['field-border', 'surface', 3], ['field-border', 'bg', 3],
  // Compare: one colour per car (header border, curve line, dot) — text-grade so labels can use it too.
  ...[1, 2, 3, 4].flatMap((n): [string, string, number][] => [[`car-${n}`, 'surface', 4.5], [`car-${n}`, 'bg', 4.5]]),
];

describe('theme contrast (WCAG AA, B20)', () => {
  it('dark tokens are the same in the media query and the manual override', () => {
    expect(darkMedia).toEqual(dark);
  });
  for (const [name, theme] of [['light', light], ['dark', dark]] as const) {
    it.each(PAIRS)(`${name}: %s on %s ≥ %s`, (fg, bg, min) => {
      expect(theme[fg], `missing --${fg}`).toBeDefined();
      expect(theme[bg], `missing --${bg}`).toBeDefined();
      expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(min);
    });
  }
});

describe('Road Paint yellow rule (DESIGN-4)', () => {
  it('the paint yellow is the same in both themes, and is text-grade only on asphalt', () => {
    expect(light.paint).toBe(dark.paint);
    for (const bg of ['bg', 'surface', 'surface-2']) expect(contrast(dark.paint, dark[bg]), bg).toBeGreaterThanOrEqual(4.5);
    expect(light.accent).not.toBe(light.paint);
  });
  it('the painted line shows on the dark panel (3:1)', () => {
    expect(contrast(dark.paint, dark.surface)).toBeGreaterThanOrEqual(3);
  });
  it('Archivo is the first font and is bundled, not fetched from a font service', () => {
    expect(css).toMatch(/--font: "Archivo Variable"/);
    const base = readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8');
    expect(base).toContain("@fontsource-variable/archivo");
    expect(base).not.toMatch(/fonts.(googleapis|gstatic).com/);
  });
});

describe('map pin colours (charger-map §5, Road Paint 4.5)', async () => {
  const { PIN, MAP_MARK } = await import('../src/lib/map-icons.ts');
  const { MAP_PALETTE } = await import('../src/lib/map-style.ts');
  it('dark glyphs read on every pin fill (4.5:1), and the fills stand out from their dark ring (3:1)', () => {
    for (const fill of [PIN.fill[3], PIN.fill[2], PIN.unavailable]) {
      expect(contrast(PIN.glyph, fill), fill).toBeGreaterThanOrEqual(4.5);
      expect(contrast(PIN.ring, fill), fill).toBeGreaterThanOrEqual(3);
    }
  });
  it('the "!" mark reads on its orange badge (4.5:1)', () => {
    expect(contrast(PIN.badgeMark, PIN.badge)).toBeGreaterThanOrEqual(4.5);
  });
  it('every pin shows on both base maps: the fill on asphalt, the ring on concrete (3:1)', () => {
    for (const fill of [PIN.fill[3], PIN.fill[2], PIN.unavailable]) expect(contrast(fill, MAP_PALETTE.dark.land), fill).toBeGreaterThanOrEqual(3);
    expect(contrast(PIN.ring, MAP_PALETTE.light.land)).toBeGreaterThanOrEqual(3);
  });
  it('clusters: the count reads on the disc (4.5:1); the yellow ring shows on asphalt and the disc on concrete (3:1)', () => {
    expect(contrast(MAP_MARK.clusterText, MAP_MARK.cluster)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(MAP_MARK.clusterRing, MAP_PALETTE.dark.land)).toBeGreaterThanOrEqual(3);
    expect(contrast(MAP_MARK.cluster, MAP_PALETTE.light.land)).toBeGreaterThanOrEqual(3);
  });
});

describe('station panel and Locate me colours (M8)', async () => {
  const { PIN, MAP_MARK } = await import('../src/lib/map-icons.ts');
  it('level badge text reads on both level fills (4.5:1)', () => {
    for (const fill of [PIN.fill[3], PIN.fill[2]]) expect(contrast(PIN.glyph, fill)).toBeGreaterThanOrEqual(4.5);
  });
  it('selected-pin ring stands out from its pale disc (3:1)', () => {
    expect(contrast(MAP_MARK.selectedRing, MAP_MARK.selectedFill)).toBeGreaterThanOrEqual(3);
  });
  it('"your location" dot keeps the map convention: white border on the blue fill (3:1)', () => {
    expect(css).toMatch(/\.map-you \{[^}]*background: #1D4ED8; border: 3px solid #FFFFFF/);
    expect(contrast('#FFFFFF', '#1D4ED8')).toBeGreaterThanOrEqual(3);
  });
});

// Trip map and trip list (3.14, Road Paint 4.5; route-planner §7), against Voltway's own base map.
describe('trip map colours (Road Paint 4.5)', async () => {
  const { TRIP_MAP } = await import('../src/lib/trip-map-style.ts');
  const { MAP_PALETTE } = await import('../src/lib/map-style.ts');
  const ground = (p: { land: string; water: string; green: string }) => [p.land, p.water, p.green];
  it('the yellow line reads on its road band, and on bare asphalt (3:1)', () => {
    expect(contrast(TRIP_MAP.route, TRIP_MAP.band)).toBeGreaterThanOrEqual(3);
    for (const bg of ground(MAP_PALETTE.dark)) expect(contrast(TRIP_MAP.route, bg), bg).toBeGreaterThanOrEqual(3);
  });
  it('the road band stands out from the concrete map (3:1), so the line never relies on yellow against a light ground', () => {
    for (const bg of ground(MAP_PALETTE.light)) expect(contrast(TRIP_MAP.band, bg), bg).toBeGreaterThanOrEqual(3);
  });
  it('a charging gap is edged in orange that shows on both maps and against the band (3:1)', () => {
    expect(contrast(TRIP_MAP.gapEdge, TRIP_MAP.band)).toBeGreaterThanOrEqual(3);
    expect(contrast(TRIP_MAP.gapEdge, MAP_PALETTE.dark.land)).toBeGreaterThanOrEqual(3);
  });
  it('stop number on its pin (4.5:1); pins, ends and the selected ring stand out from their rings (3:1)', () => {
    expect(contrast(TRIP_MAP.stopText, TRIP_MAP.stop)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(TRIP_MAP.stop, TRIP_MAP.stopRing)).toBeGreaterThanOrEqual(3);
    expect(contrast(TRIP_MAP.start, TRIP_MAP.startRing)).toBeGreaterThanOrEqual(3);
    expect(contrast(TRIP_MAP.end, TRIP_MAP.endRing)).toBeGreaterThanOrEqual(3);
    expect(contrast(TRIP_MAP.selectedFill, TRIP_MAP.selectedRing)).toBeGreaterThanOrEqual(3);
  });
  it('the trip list marks use the theme stop-bar token, which stands out from the card in both themes (3:1)', () => {
    expect(css).toMatch(/\.ti-start \.ti-mark \{ background: var\(--mark\)/);
    expect(css).toMatch(/\.ti-num \{[^}]*background: var\(--mark\); color: var\(--surface\)/);
    for (const theme of [light, dark]) expect(contrast(theme.mark, theme.surface)).toBeGreaterThanOrEqual(4.5);
  });
});
