// Owner decisions B20 and B53 (Road Paint): both themes must pass WCAG 2.x AA. Reads the colour tokens straight
// from global.css so a palette change that breaks contrast fails CI.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
}
const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {'))));
const darkStart = css.indexOf(':root[data-theme="dark"] {');
const dark = tokens(css.slice(darkStart, css.indexOf('}', darkStart)));
const mediaStart = css.indexOf(':root:not([data-theme="light"]) {');
const darkMedia = tokens(css.slice(mediaStart, css.indexOf('}', mediaStart)));

const lum = (hex: string) => {
  const [r, g, b] = hex.slice(1).match(/../g)!.map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Text needs 4.5:1; control outlines and chart lines (non-text UI) need 3:1.
const PAIRS: [string, string, number][] = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5],
  ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['muted', 'surface-2', 4.5],
  ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['accent', 'surface-2', 4.5], ['accent', 'accent-soft', 4.5],
  ['accent-ink', 'accent', 4.5],
  // Road Paint: the label on a filled yellow button; the stop bar and the painted line on a panel.
  ['paint-ink', 'paint', 4.5], ['mark', 'surface', 3], ['mark', 'bg', 3],
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

describe('map pin colours (charger-map §5)', async () => {
  const { PIN } = await import('../src/lib/map-icons.ts');
  it('white glyphs read on every pin fill (4.5:1), and the fills stand out from a white ring (3:1)', () => {
    for (const fill of [PIN.fill[3], PIN.fill[2], PIN.unavailable]) {
      expect(contrast(PIN.glyph, fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(PIN.ring, fill)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('station panel and Locate me colours (M8)', async () => {
  const { PIN } = await import('../src/lib/map-icons.ts');
  it('level badge text reads on both level fills (4.5:1)', () => {
    for (const fill of [PIN.fill[3], PIN.fill[2]]) expect(contrast(PIN.glyph, fill)).toBeGreaterThanOrEqual(4.5);
  });
  it('selected-pin ring (#111827) stands out from its white disc (3:1)', () => {
    expect(contrast('#111827', '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });
  it('"your location" dot: white border on the blue fill (3:1)', () => {
    expect(contrast('#FFFFFF', '#1D4ED8')).toBeGreaterThanOrEqual(3);
  });
});

// Trip map and itinerary (3.14, route-planner §7). Base-map colours come from the OpenFreeMap
// styles in config.ts (positron: land, water, wood; dark: land, water, wood), read 2026-11-16.
const BASE = { light: ['#F2F3F0', '#C2C8CA', '#DCE0DC'], dark: ['#0C0C0C', '#1B1B1D', '#202020'] };

describe('trip map colours (3.14)', async () => {
  const { TRIP_MAP } = await import('../src/lib/trip-map-style.ts');
  it('the route line stands out from every light base colour (3:1); its white casing does on dark (3:1)', () => {
    for (const bg of BASE.light) expect(contrast(TRIP_MAP.route, bg), bg).toBeGreaterThanOrEqual(3);
    for (const bg of BASE.dark) expect(contrast(TRIP_MAP.casing, bg), bg).toBeGreaterThanOrEqual(3);
  });
  it('route, charging gap, pins and ends stand out from their white casing or ring (3:1)', () => {
    for (const fill of [TRIP_MAP.route, TRIP_MAP.gap, TRIP_MAP.stop, TRIP_MAP.start, TRIP_MAP.end]) {
      expect(contrast(fill, TRIP_MAP.ring), fill).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(TRIP_MAP.selected, TRIP_MAP.ring)).toBeGreaterThanOrEqual(3);
  });
  it('the white stop number reads on its pin (4.5:1)', () => {
    expect(contrast(TRIP_MAP.stopText, TRIP_MAP.stop)).toBeGreaterThanOrEqual(4.5);
  });
  it('the itinerary markers in global.css use the same colours as the map', () => {
    expect(css).toMatch(new RegExp(String.raw`\.ti-start \.ti-mark \{ background: ` + TRIP_MAP.start));
    expect(css).toMatch(new RegExp(String.raw`\.ti-num \{[^}]*background: ` + TRIP_MAP.stop));
  });
  it('itinerary markers (start, numbered stop) stand out from the card in both themes (3:1)', () => {
    for (const theme of [light, dark]) {
      for (const fill of [TRIP_MAP.start, TRIP_MAP.stop]) expect(contrast(fill, theme.surface), `${fill} on ${theme.surface}`).toBeGreaterThanOrEqual(3);
    }
  });
});
