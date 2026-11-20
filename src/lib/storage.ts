// Browser storage for personal settings (database-ui.md §3). No accounts.
// If storage is blocked (private window, disabled), everything still works and simply
// forgets on reload: reads fall back to memory and writes never throw.

const memory = new Map<string, string>();

function store(): Storage | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    const probe = '__voltway_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function getItem(key: string): string | null {
  const s = store();
  try {
    if (s) return s.getItem(key);
  } catch {
    /* fall through to memory */
  }
  return memory.get(key) ?? null;
}

export function setItem(key: string, value: string): void {
  memory.set(key, value);
  const s = store();
  try {
    s?.setItem(key, value);
  } catch {
    /* storage full or blocked: memory copy is enough for this visit */
  }
}

export function getJSON<T>(key: string, fallback: T): T {
  const raw = getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  setItem(key, JSON.stringify(value));
}

export const KEYS = {
  units: 'voltway.units',
  tempUnit: 'voltway.tempUnit', // B116: °C / °F
  curveSettings: 'voltway.curveSettings',
  theme: 'voltway.theme',
  motion: 'voltway.motion',
  price: 'voltway.price',
  mapView: 'voltway.mapView',
  mapFilters: 'voltway.mapFilters',
  myCar: 'voltway.myCar',
  compare: 'voltway.compare',
  browse: 'voltway.browse',
  browseOpen: 'voltway.browseOpen',
  mapCarNudge: 'voltway.mapCarNudge',
  lastTrip: 'voltway.lastTrip',
  recentDestinations: 'voltway.recentDestinations',
  routeOptions: 'voltway.routeOptions',
} as const;
