// Voltway's own base-map look, "Road Paint" (DESIGN-4, B53): asphalt land in dark, pale concrete in
// light. The tiles, glyphs and layer list still come from OpenFreeMap's hosted styles (config.ts);
// this recolours every layer before the map draws it, so a change upstream never leaves a
// half-themed map: a layer no rule knows keeps its own colour.

import type { Theme } from '../scripts/theme-client.ts';

export interface MapPalette {
  land: string; water: string; green: string; ice: string; built: string; building: string;
  /** Road fills, from side street to motorway, and the edge drawn under them. */
  minor: string; major: string; motorway: string; casing: string;
  /** Major roads and motorways when zoomed out to a region, where they are thin lines. */
  majorFar: string; motorwayFar: string;
  rail: string; boundary: string;
  /** Town and city names; smaller places and road names; names on water; the outline behind text. */
  label: string; labelMinor: string; waterLabel: string; halo: string;
}

export const MAP_PALETTE: Record<Theme, MapPalette> = {
  dark: {
    land: '#1A1B1E', water: '#10151C', green: '#1C211E', ice: '#232428', built: '#1D1E21', building: '#222327',
    minor: '#2E2F34', major: '#3F4046', motorway: '#55565D', casing: '#101113',
    majorFar: '#4A4B51', motorwayFar: '#6E6F76',
    rail: '#2C2D31', boundary: '#5C5B54',
    label: '#D8D6CD', labelMinor: '#A4A29A', waterLabel: '#7F8FA3', halo: '#1A1B1E',
  },
  light: {
    land: '#EEEDE8', water: '#B4C4CC', green: '#DCE3D5', ice: '#F8F7F3', built: '#E8E6DF', building: '#DCDAD2',
    minor: '#FFFFFF', major: '#FFFFFF', motorway: '#FFFFFF', casing: '#A9A79E',
    majorFar: '#8F8D85', motorwayFar: '#6E6D66',
    rail: '#C2C0B8', boundary: '#8C8A82',
    label: '#1A1B1E', labelMinor: '#55544E', waterLabel: '#2F4858', halo: '#EEEDE8',
  },
};

interface Layer {
  id: string;
  type: string;
  'source-layer'?: string;
  paint?: Record<string, unknown>;
  [key: string]: unknown;
}
interface Style { layers: Layer[]; [key: string]: unknown }

/** A zoom ramp keeps its stops and takes new colours: thin and strong far out, the road fill close in. */
const ramp = (old: unknown, far: string, near: string): unknown =>
  Array.isArray(old) && old[0] === 'interpolate' && old.length >= 7 ? [...old.slice(0, 4), far, old[5], near] : near;

function roadColour(id: string, old: unknown, p: MapPalette): string | unknown {
  if (/rail/.test(id)) return /dashline/.test(id) ? p.land : p.rail;
  if (/pier/.test(id)) return p.land;
  if (/casing/.test(id)) return p.casing;
  if (/motorway/.test(id)) return /subtle/.test(id) ? p.motorwayFar : ramp(old, p.motorwayFar, p.motorway);
  if (/major/.test(id)) return /subtle/.test(id) ? p.majorFar : p.major;
  return p.minor; // minor roads and paths
}

function paintFor(layer: Layer, p: MapPalette): Record<string, unknown> | null {
  const { id, type } = layer;
  const src = layer['source-layer'] ?? '';
  const old = layer.paint ?? {};
  if (type === 'background') return { 'background-color': p.land };
  if (type === 'fill') {
    if (src === 'water') return { 'fill-color': p.water };
    if (src === 'park' || /park|wood/.test(id)) return { 'fill-color': p.green };
    if (/ice|glacier/.test(id)) return { 'fill-color': p.ice };
    if (src === 'landuse') return { 'fill-color': p.built };
    if (src === 'building') return { 'fill-color': p.building, 'fill-outline-color': p.built };
    if (src === 'aeroway') return { 'fill-color': p.built };
    if (src === 'transportation') return { 'fill-color': p.land };
    return null;
  }
  if (type === 'line') {
    if (src === 'waterway') return { 'line-color': p.water };
    if (src === 'boundary') return { 'line-color': p.boundary };
    if (src === 'aeroway') return { 'line-color': /casing/.test(id) ? p.casing : p.minor };
    if (src === 'transportation') return { 'line-color': roadColour(id, old['line-color'], p) };
    return null;
  }
  if (type === 'symbol') {
    if (!('text-color' in old)) return null; // road shields and one-way arrows keep their own drawing
    if (src === 'water_name' || src === 'waterway') return { 'text-color': p.waterLabel, 'text-halo-color': p.water };
    if (src === 'place') {
      const main = /city|town|country|state/.test(id);
      return { 'text-color': main ? p.label : p.labelMinor, 'text-halo-color': p.halo };
    }
    return { 'text-color': p.labelMinor, 'text-halo-color': p.halo };
  }
  return null;
}

/** Returns a copy of an OpenFreeMap style with every layer recoloured for the theme. */
export function roadPaintStyle<T extends object>(style: T, theme: Theme): T {
  const p = MAP_PALETTE[theme];
  const s = style as unknown as Style;
  const layers = s.layers.map((layer) => {
    const paint = paintFor(layer, p);
    return paint ? { ...layer, paint: { ...layer.paint, ...paint } } : layer;
  });
  return { ...s, layers } as unknown as T;
}
