// Trip planner routing (route-planner.md §2): the app's only server code, deployed as a Vercel Function.
// Holds the openrouteservice key; see src/lib/ors.ts for checks, trimming, caching and errors.
import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { handleRoute } from '../../lib/ors.ts';

export const prerender = false;

export const GET: APIRoute = ({ url }) => handleRoute(url, getSecret('ORS_API_KEY'));
