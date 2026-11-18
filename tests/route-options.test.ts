// Route options from Settings (B73, 5.3): reading damaged storage, saving, the event, the API form.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { avoidList, avoidQuery, readRouteOptions, routeOptions, ROUTE_OPTIONS_EVENT, setRouteOptions } from '../src/lib/route-options.ts';
import { KEYS } from '../src/lib/storage.ts';

describe('readRouteOptions', () => {
  it('reads saved switches', () => {
    expect(readRouteOptions({ avoidTolls: true, avoidHighways: false })).toEqual({ avoidTolls: true, avoidHighways: false });
  });
  it('treats anything but true as off', () => {
    for (const bad of [null, undefined, 'x', 3, [], { avoidTolls: 'true', avoidHighways: 1 }]) {
      expect(readRouteOptions(bad)).toEqual({ avoidTolls: false, avoidHighways: false });
    }
  });
});

describe('avoid list and query', () => {
  it('uses the one order the API expects', () => {
    expect(avoidList({ avoidTolls: true, avoidHighways: true })).toEqual(['tolls', 'highways']);
    expect(avoidList({ avoidTolls: false, avoidHighways: true })).toEqual(['highways']);
    expect(avoidQuery({ avoidTolls: true, avoidHighways: true })).toBe('&avoid=tolls,highways');
    expect(avoidQuery({ avoidTolls: false, avoidHighways: false })).toBe('');
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
    setRouteOptions({ avoidTolls: true, avoidHighways: false });
    expect(JSON.parse(store.get(KEYS.routeOptions)!)).toEqual({ avoidTolls: true, avoidHighways: false });
    expect(routeOptions()).toEqual({ avoidTolls: true, avoidHighways: false });
    expect(seen).toEqual([{ avoidTolls: true, avoidHighways: false }]);
  });
  it('defaults to nothing avoided', () => {
    expect(routeOptions()).toEqual({ avoidTolls: false, avoidHighways: false });
    store.set(KEYS.routeOptions, '{broken');
    expect(routeOptions()).toEqual({ avoidTolls: false, avoidHighways: false });
  });
});
