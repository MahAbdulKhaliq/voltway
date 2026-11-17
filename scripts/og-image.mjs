// Draws the link-preview image (public/og.png, 1200×630) that LinkedIn, Slack and others show
// for a shared Voltway link (checklist P.3). Run `node scripts/og-image.mjs` after changing it;
// the PNG is committed, so the build doesn't need this. Colours follow the site's dark theme,
// the map pins (map-icons.ts) and the route line (trip-map-style.ts).

import sharp from 'sharp';

const W = 1200, H = 630;
const bg = '#0B1120', text = '#E5E7EB', muted = '#94A3B8', accent = '#60A5FA';
const route = '#2563EB', casing = '#FFFFFF', l3 = '#C2410C', l2 = '#1D4ED8', start = '#15803D', end = '#E5E7EB';
const font = "Segoe UI, system-ui, Helvetica, Arial, sans-serif";

// A made-up road on the right half, with three numbered charging stops along it.
const road = 'M 640 520 C 720 470, 760 430, 820 400 S 930 330, 980 300 S 1080 200, 1130 120';
const stops = [[790, 418, 1], [930, 331, 2], [1060, 215, 3]];
const otherPins = [[700, 380, l3], [880, 470, l2], [1010, 410, l3], [760, 250, l2], [1120, 330, l3], [960, 160, l2], [860, 230, l3], [1150, 470, l2]];

const pin = (x, y, fill, o = 0.4) =>
  `<g opacity="${o}"><circle cx="${x}" cy="${y}" r="11" fill="${fill}" stroke="#fff" stroke-width="2.5"/></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#1E293B" stroke-width="1"/>
    </pattern>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0.42" stop-color="${bg}" stop-opacity="1"/>
      <stop offset="0.62" stop-color="${bg}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  ${otherPins.map(([x, y, f]) => pin(x, y, f)).join('')}
  <path d="${road}" fill="none" stroke="${casing}" stroke-width="13" stroke-linecap="round"/>
  <path d="${road}" fill="none" stroke="${route}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="640" cy="520" r="12" fill="${start}" stroke="#fff" stroke-width="4"/>
  <circle cx="1130" cy="120" r="12" fill="${end}" stroke="${bg}" stroke-width="4"/>
  ${stops.map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="20" fill="${l3}" stroke="#fff" stroke-width="3"/>
  <text x="${x}" y="${y + 7}" text-anchor="middle" font-family="${font}" font-weight="700" font-size="20" fill="#fff">${n}</text>`).join('')}
  <rect width="${W}" height="${H}" fill="url(#fade)"/>

  <g transform="translate(72 84)">
    <rect width="56" height="56" rx="14" fill="#0b7a53"/>
    <path d="M31.5 7 14 31.5h12.25L22.75 49 42 22.75H29.75z" fill="#fff"/>
    <text x="76" y="41" font-family="${font}" font-weight="700" font-size="38" fill="${text}">Voltway</text>
  </g>
  <text font-family="${font}" font-weight="700" font-size="58" fill="${text}">
    <tspan x="72" y="262">EV road trips,</tspan>
    <tspan x="72" y="334">planned around your</tspan>
    <tspan x="72" y="406" fill="${accent}">car's charging curve</tspan>
  </text>
  <text font-family="${font}" font-size="26" fill="${muted}">
    <tspan x="72" y="476">Specs, charging curves, a charger map and a</tspan>
    <tspan x="72" y="512">route planner. A source on every figure.</tspan>
  </text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('wrote public/og.png');
