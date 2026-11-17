// Draws the link-preview image (public/og.png, 1200×630) that LinkedIn, Slack and others show
// for a shared Voltway link (checklist P.3). Run `node scripts/og-image.mjs` after changing it;
// the PNG is committed, so the build doesn't need this. Colours follow the Road Paint dark theme
// (global.css), the map pins (map-icons.ts) and the route line (trip-map-style.ts).

import sharp from 'sharp';

const W = 1200, H = 630;
const bg = '#1A1B1E', text = '#F5F3EC', muted = '#A4A29A', paint = '#FFD400', ink = '#1A1B1E';
const band = '#2B2C30', road2 = '#34353A', l3 = '#FFD400', l2 = '#F5F3EC';
const font = "Archivo, 'Segoe UI', system-ui, Helvetica, Arial, sans-serif";

// A made-up road on the right half, with three numbered charging stops along it.
const road = 'M 640 520 C 720 470, 760 430, 820 400 S 930 330, 980 300 S 1080 200, 1130 120';
const sideRoads = ['M 600 300 C 700 320, 780 300, 880 250 S 1080 240, 1200 280', 'M 700 630 C 760 540, 900 520, 1000 470 S 1140 400, 1200 420', 'M 860 0 C 880 90, 940 150, 960 240'];
const stops = [[790, 418, 1], [930, 331, 2], [1060, 215, 3]];
const otherPins = [[700, 380, l3], [880, 470, l2], [1010, 410, l3], [760, 250, l2], [1120, 330, l3], [960, 160, l2], [860, 230, l3], [1150, 470, l2]];

const pin = (x, y, fill, o = 0.55) =>
  `<g opacity="${o}"><circle cx="${x}" cy="${y}" r="10" fill="${fill}" stroke="${ink}" stroke-width="2.5"/></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0.42" stop-color="${bg}" stop-opacity="1"/>
      <stop offset="0.62" stop-color="${bg}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${sideRoads.map((d) => `<path d="${d}" fill="none" stroke="${road2}" stroke-width="5" stroke-linecap="round"/>`).join('')}
  ${otherPins.map(([x, y, f]) => pin(x, y, f)).join('')}
  <path d="${road}" fill="none" stroke="${band}" stroke-width="20" stroke-linecap="round"/>
  <path d="${road}" fill="none" stroke="${paint}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="640" cy="520" r="12" fill="${paint}" stroke="${ink}" stroke-width="4"/>
  <circle cx="1130" cy="120" r="12" fill="${ink}" stroke="${text}" stroke-width="4"/>
  ${stops.map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="20" fill="#FFFFFF" stroke="${ink}" stroke-width="3"/>
  <text x="${x}" y="${y + 7}" text-anchor="middle" font-family="${font}" font-weight="700" font-size="20" fill="${ink}">${n}</text>`).join('')}
  <rect width="${W}" height="${H}" fill="url(#fade)"/>

  <g transform="translate(72 84)">
    <g transform="scale(2.3333333333333335)"><rect width="24" height="24" rx="6" fill="${paint}"/><path d="M9.4 3h5.2L20 21.5H4Z" fill="${ink}"/><path d="M12.9 4.6 9.7 12.3h2.6l-1.3 6.5 3.8-8.1h-2.7l.8-6.1Z" fill="${paint}"/></g>
    <text x="76" y="41" font-family="${font}" font-weight="800" font-size="38" fill="${text}">Voltway</text>
  </g>
  <text font-family="${font}" font-weight="800" font-size="58" fill="${text}">
    <tspan x="72" y="262">EV road trips,</tspan>
    <tspan x="72" y="334">planned around your</tspan>
    <tspan x="72" y="406" fill="${paint}">car's charging curve</tspan>
  </text>
  <text font-family="${font}" font-size="26" fill="${muted}">
    <tspan x="72" y="476">Specs, charging curves, a charger map and a</tspan>
    <tspan x="72" y="512">trip planner. A source on every figure.</tspan>
  </text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('wrote public/og.png');
