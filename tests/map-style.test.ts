// The base map's Road Paint look (DESIGN-4, 4.4): every OpenFreeMap layer takes a palette colour,
// unknown layers are left alone, and the things a driver reads at regional zoom keep their contrast.
import { describe, expect, it } from 'vitest';
import { DARK_SHIELD, MAP_PALETTE, roadPaintStyle, shieldImage } from '../src/lib/map-style.ts';
import { contrast } from './contrast-util.ts';

// The layer ids and source layers of OpenFreeMap's "positron" and "dark" styles (read 2026-11-17).
const style = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': 'rgb(12,12,12)' } },
    { id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': 'rgb(27,27,29)' } },
    { id: 'landcover_wood', type: 'fill', 'source-layer': 'landcover', paint: { 'fill-color': 'rgb(32,32,32)', 'fill-opacity': 0.4 } },
    { id: 'building', type: 'fill', 'source-layer': 'building', paint: { 'fill-color': '#000' } },
    { id: 'highway_minor', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#181818', 'line-width': 2 } },
    { id: 'highway_major_casing', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#333' } },
    { id: 'highway_major_subtle', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#2a2a2a' } },
    { id: 'highway_motorway_inner', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': ['interpolate', ['linear'], ['zoom'], 5.8, 'hsla(0,0%,85%,0.53)', 6, '#000'] } },
    { id: 'railway_dashline', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#000' } },
    { id: 'boundary_state', type: 'line', 'source-layer': 'boundary', paint: { 'line-color': '#333' } },
    { id: 'place_city', type: 'symbol', 'source-layer': 'place', layout: { 'text-field': '{name}' }, paint: { 'text-color': 'rgb(101,101,101)' } },
    { id: 'place_village', type: 'symbol', 'source-layer': 'place', paint: { 'text-color': 'rgb(101,101,101)' } },
    { id: 'water_name', type: 'symbol', 'source-layer': 'water_name', paint: { 'text-color': '#000' } },
    { id: 'highway-shield-non-us', type: 'symbol', 'source-layer': 'transportation_name', layout: { 'icon-image': 'road_{ref_length}' } },
    { id: 'highway_name_other', type: 'symbol', 'source-layer': 'transportation_name', layout: { 'text-field': '{name}', 'text-font': ['Noto Sans Regular'], 'text-size': 10, 'text-transform': 'uppercase', 'symbol-placement': 'line' }, paint: { 'text-color': '#504e4e' } },
    { id: 'highway-name-major', type: 'symbol', 'source-layer': 'transportation_name', layout: { 'text-field': '{name}', 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13] }, paint: { 'text-color': '#666' } },
    { id: 'something_new', type: 'heatmap', paint: { 'heatmap-color': 'red' } },
  ],
};
const paintOf = (s: typeof style, id: string) => s.layers.find((l) => l.id === id)!.paint as Record<string, unknown> | undefined;

describe('roadPaintStyle', () => {
  for (const theme of ['dark', 'light'] as const) {
    const p = MAP_PALETTE[theme];
    const out = roadPaintStyle(style, theme);
    it(`${theme}: land, water, green, roads, borders and labels take the palette`, () => {
      expect(paintOf(out, 'background')).toEqual({ 'background-color': p.land });
      expect(paintOf(out, 'water')!['fill-color']).toBe(p.water);
      expect(paintOf(out, 'landcover_wood')).toEqual({ 'fill-color': p.green, 'fill-opacity': 0.4 });
      expect(paintOf(out, 'building')!['fill-color']).toBe(p.building);
      expect(paintOf(out, 'highway_minor')).toEqual({ 'line-color': p.minor, 'line-width': 2 });
      expect(paintOf(out, 'highway_major_casing')!['line-color']).toBe(p.casing);
      expect(paintOf(out, 'highway_major_subtle')!['line-color']).toBe(p.majorFar);
      expect(paintOf(out, 'highway_motorway_inner')!['line-color']).toEqual(['interpolate', ['linear'], ['zoom'], 5.8, p.motorwayFar, 6, p.motorway]);
      expect(paintOf(out, 'railway_dashline')!['line-color']).toBe(p.land);
      expect(paintOf(out, 'boundary_state')!['line-color']).toBe(p.boundary);
      expect(paintOf(out, 'place_city')).toEqual({ 'text-color': p.label, 'text-halo-color': p.halo });
      expect(paintOf(out, 'place_village')!['text-color']).toBe(p.labelMinor);
      expect(paintOf(out, 'water_name')).toEqual({ 'text-color': p.waterLabel, 'text-halo-color': p.water });
    });
    it(`${theme}: layers no rule knows are left as they were`, () => {
      expect(paintOf(out, 'something_new')).toEqual({ 'heatmap-color': 'red' });
    });
    it(`${theme}: sources and the rest of the style are untouched, and the input is not changed`, () => {
      expect(out.sources).toBe(style.sources);
      expect(paintOf(style, 'background')).toEqual({ 'background-color': 'rgb(12,12,12)' });
    });
    it(`${theme}: place names read on land (4.5:1), water names on water (4.5:1), far motorways and borders on land (3:1)`, () => {
      expect(contrast(p.label, p.land)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.labelMinor, p.land)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.waterLabel, p.water)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.motorwayFar, p.land)).toBeGreaterThanOrEqual(3);
      expect(contrast(p.boundary, p.land)).toBeGreaterThanOrEqual(2.5);
    });
  }
  it('the land is the page ground of each theme', () => {
    expect(MAP_PALETTE.dark.land).toBe('#1A1B1E');
    expect(MAP_PALETTE.light.land).toBe('#EEEDE8');
  });

  it('B89: road names keep their capitals, bold, at least 12 px; shields and places are untouched', () => {
    const out = roadPaintStyle(style, 'dark');
    const layoutOf = (id: string) => out.layers.find((l) => l.id === id)!.layout as Record<string, unknown>;
    expect(layoutOf('highway_name_other')).toMatchObject({ 'text-transform': 'none', 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'symbol-placement': 'line' });
    expect(layoutOf('highway-name-major')['text-size']).toEqual(['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13]);
    expect(layoutOf('highway-name-major')['text-font']).toEqual(['Noto Sans Bold']);
    expect(layoutOf('place_city')).toEqual({ 'text-field': '{name}' });
  });

  it('B89 round 4: light keeps the sprite shields; dark draws its own dark badge with light text', () => {
    const light = roadPaintStyle(style, 'light');
    expect(light.layers.find((l) => l.id === 'highway-shield-non-us')).toBe(style.layers.find((l) => l.id === 'highway-shield-non-us'));
    const dark = roadPaintStyle(style, 'dark').layers.find((l) => l.id === 'highway-shield-non-us')!;
    expect(dark.layout).toMatchObject({ 'icon-image': DARK_SHIELD, 'icon-text-fit': 'both' });
    expect(dark.paint).toMatchObject({ 'text-color': MAP_PALETTE.dark.label });
    expect(contrast(MAP_PALETTE.dark.label, MAP_PALETTE.dark.major)).toBeGreaterThanOrEqual(4.5);
    const { image, options } = shieldImage();
    const px = (x: number, y: number) => [...image.data.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
    expect(px(0, 0)[3]).toBe(0); // rounded corner
    expect(px(12, 12)).toEqual([0x3F, 0x40, 0x46, 255]); // the badge fill
    expect(options.stretchX[0][1]).toBeGreaterThan(options.stretchX[0][0]);
  });
});
