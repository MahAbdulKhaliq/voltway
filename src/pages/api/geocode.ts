// Address search (route-planner.md §6, B147): Search full address, or address-like text after a pause.
// Holds the openrouteservice key; see src/lib/ors.ts for checks, trimming, caching and errors.
import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { handleGeocode } from '../../lib/ors.ts';

export const prerender = false;

export const GET: APIRoute = ({ url }) => handleGeocode(url, getSecret('ORS_API_KEY'));
