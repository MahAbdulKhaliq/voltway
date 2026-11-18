// Links that hand driving to Google Maps or Apple Maps (R7, B72; DESIGN-5 §1.1–1.2). Voltway has no
// turn-by-turn: it sends the next stop, or the whole remaining trip when it fits the app's limit.
// Coordinates only (lat,lng, 5 decimals), so no names or addresses leave the page.
//
// Google: Maps URLs (developers.google.com/maps/documentation/urls/get-started): `destination`,
//   `waypoints=a|b|c`, `travelmode=driving`; `dir_action=navigate` starts navigation, but the docs
//   don't say it works with waypoints, so the whole-trip link leaves it out (route preview + Start).
//   No avoid option exists in Maps URLs.
// Apple: unified Maps URLs (iOS 18.4+, developer.apple.com/documentation/mapkit/unified-map-urls):
//   `/directions?destination=…&waypoint=…&mode=driving&avoid=tolls,highways`.

import type { RouteOptions } from './route-options.ts';

export type LonLatPoint = readonly [number, number];

/** Remaining stops each app can take at once (B72): Google's documented phone-browser limit; Apple below its app's own limit. */
export const WHOLE_TRIP_MAX = { google: 3, apple: 9 } as const;

const at = ([lon, lat]: LonLatPoint) => `${Math.round(lat * 1e5) / 1e5},${Math.round(lon * 1e5) / 1e5}`;

const appleAvoid = (o?: RouteOptions) => {
  const a = [o?.avoidTolls && 'tolls', o?.avoidHighways && 'highways'].filter(Boolean);
  return a.length ? `&avoid=${a.join(',')}` : '';
};

/** One place: the station panel and Drive's "Navigate to this stop". */
export function directionsUrls(p: LonLatPoint, opts?: RouteOptions): { google: string; apple: string } {
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${at(p)}&travelmode=driving&dir_action=navigate`,
    apple: `https://maps.apple.com/directions?destination=${at(p)}&mode=driving${appleAvoid(opts)}`,
  };
}

/**
 * The remaining stops as waypoints and the trip's end as the destination, from where the phone is.
 * An app is left out (null) when there are more stops than it takes.
 */
export function wholeTripUrls(stops: readonly LonLatPoint[], end: LonLatPoint, opts?: RouteOptions): { google: string | null; apple: string | null } {
  const g = stops.length <= WHOLE_TRIP_MAX.google
    ? `https://www.google.com/maps/dir/?api=1&destination=${at(end)}${stops.length ? `&waypoints=${stops.map(at).join('%7C')}` : ''}&travelmode=driving`
    : null;
  const a = stops.length <= WHOLE_TRIP_MAX.apple
    ? `https://maps.apple.com/directions?destination=${at(end)}${stops.map((s) => `&waypoint=${at(s)}`).join('')}&mode=driving${appleAvoid(opts)}`
    : null;
  return { google: g, apple: a };
}
