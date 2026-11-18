// Route options from Settings (B73, 5.3): reading damaged storage, saving, the event, the API form.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { avoidList, avoidQuery, readRouteOptions, routeOptions, ROUTE_OPTIONS_EVENT, sameRouteOptions, setRouteOptions } from '../src/lib/route-options.ts';
import { KEYS } from '../src/lib/storage.ts';

describe('readRouteOptions', () => {
  it('reads saved switches', () => {
    expect(readRouteOptions({ avoidTolls: true, avoidHighways: false, crossBorder: false })).toEqual({ avoidTolls: true, avoidHighways: false, crossBorder: false });
  });
  it('treats anything but true as off for the avoid switches; crossing stays allowed (B80)', () => {
    for (const bad of [null, undefined, 'x', 3, [], { avoidTolls: 'true', avoidHighways: 1 }]) {
      expect(readRouteOptions(bad)).toEqual({ avoidTolls: false, avoidHighways: false, crossBorder: true });
    }
  });
});

describe('avoid list and query', () => {
  it('uses the one order the API expects', () => {
    expect(avoidList({ avoidTolls: true, avoidHighways: true, crossBorder: false })).toEqual(['tolls', 'highways']);
    expect(avoidList({ avoidTolls: false, avoidHighways: true, crossBorder: false })).toEqual(['highways']);
    expect(avoidQuery({ avoidTolls: true, avoidHighways: true, crossBorder: false })).toBe('&avoid=tolls,highways');
    expect(avoidQuery({ avoidTolls: false, avoidHighways: false, crossBorder: false })).toBe('');
  });
  it('B80: Stay within the border is off unless crossBorder is exactly false; off adds border=cross', () => {
    expect(readRouteOptions({ crossBorder: 'false' }).crossBorder).toBe(true);
    expect(readRouteOptions({ avoidTolls: true, avoidHighways: false }).crossBorder).toBe(true); // a B73 entry
    expect(readRouteOptions({ crossBorder: true }).crossBorder).toBe(true);
    expect(readRouteOptions({ crossBorder: false }).crossBorder).toBe(false);
    expect(avoidQuery({ avoidTolls: false, avoidHighways: false, crossBorder: true })).toBe('&border=cross');
    expect(avoidQuery({ avoidTolls: true, avoidHighways: false, crossBorder: true })).toBe('&avoid=tolls&border=cross');
    expect(avoidList({ avoidTolls: false, avoidHighways: false, crossBorder: true })).toEqual([]);
  });
  it('B79: sameRouteOptions sees a border change', () => {
    const a = { avoidTolls: false, avoidHighways: false, crossBorder: false };
    expect(sameRouteOptions(a, { ...a })).toBe(true);
    expect(sameRouteOptions(a, { ...a, crossBorder: true })).toBe(false);
  });
});

describe('saving', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('CustomEvent', class extends Event { detail: unknown; constructor(t: string, i?: { detail?: unknown }) { super(t); this.detail = i?.detail; } });
  });
  it('saves to voltway.routeOptions and announces the change', () => {
    const seen: unknown[] = [];
    (window as unknown as EventTarget).addEventListener(ROUTE_OPTIONS_EVENT, (e) => seen.push((e as CustomEvent).detail));
    setRouteOptions({ avoidTolls: true, avoidHighways: false, crossBorder: false });
    expect(JSON.parse(store.get(KEYS.routeOptions)!)).toEqual({ avoidTolls: true, avoidHighways: false, crossBorder: false });
    expect(routeOptions()).toEqual({ avoidTolls: true, avoidHighways: false, crossBorder: false });
    expect(seen).toEqual([{ avoidTolls: true, avoidHighways: false, crossBorder: false }]);
  });
  it('defaults to nothing avoided and crossing allowed (B80)', () => {
    expect(routeOptions()).toEqual({ avoidTolls: false, avoidHighways: false, crossBorder: true });
    store.set(KEYS.routeOptions, '{broken');
    expect(routeOptions()).toEqual({ avoidTolls: false, avoidHighways: false, crossBorder: true });
  });
});
