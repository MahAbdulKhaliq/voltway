// Trip planner routing (route-planner.md §2): the app's only server code, deployed as a Vercel Function.
// Holds the openrouteservice key; see src/lib/ors.ts for checks, trimming, caching and errors.
// The Canada and US outlines (B74, B78) are bundled here, so browsers never download them.
import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { handleRoute } from '../../lib/ors.ts';
import { makeCountriesOf, type Outline } from '../../lib/country.ts';
import ca from '../../../data/imported/naturalearth/ca.json';
import us from '../../../data/imported/naturalearth/us.json';

export const prerender = false;

const countriesOf = makeCountriesOf({
  ca: { polygons: ca.polygons as Outline, border: ca.border },
  us: { polygons: us.polygons as Outline, border: us.border },
});

export const GET: APIRoute = ({ url }) => handleRoute(url, getSecret('ORS_API_KEY'), fetch, countriesOf);
