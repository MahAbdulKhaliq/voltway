// Trip planner routing (route-planner.md §2): the app's only server code, deployed as a Vercel Function.
// Holds the openrouteservice key; see src/lib/ors.ts for checks, trimming, caching and errors.
// The Canada outline (B74) is bundled here, so browsers never download it.
import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { handleRoute } from '../../lib/ors.ts';
import { makeInCanada, type Outline } from '../../lib/country.ts';
import outline from '../../../data/imported/naturalearth/ca.json';

export const prerender = false;

const inCanada = makeInCanada(outline.polygons as Outline, outline.border);

export const GET: APIRoute = ({ url }) => handleRoute(url, getSecret('ORS_API_KEY'), fetch, inCanada);
