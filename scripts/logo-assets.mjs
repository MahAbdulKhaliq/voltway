// Makes every logo file from the owner's artwork (scripts/assets/logo-source.webp, 2026-11-20, B118):
// the header mark (light and dark), the favicons and the mark the link-preview image uses.
// Run `node scripts/logo-assets.mjs`, then `node scripts/og-image.mjs`. The outputs are committed,
// so the build doesn't need this.
//
// The mark's road and V are near-black, which disappears on the dark theme's #1A1B1E. The dark-theme
// mark and the favicons (browser tabs can be dark) get a thin cream outline (the dark theme's
// --text) that follows the shape. The light-theme mark is the artwork as drawn.

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC = 'scripts/assets/logo-source.webp';
const HALO = { r: 0xf5, g: 0xf3, b: 0xec }; // dark theme --text
const DARK_BG = '#1A1B1E'; // dark theme --bg

/** The artwork with faint background noise cleared, cropped to the mark. */
async function cleanMark() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] < 32) { data[i + 3] = 0; continue; }
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return sharp(data, { raw: info }).extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }).png().toBuffer();
}

/** The mark at a height (px), optionally with an outline `halo` px wide, padded by that much. */
async function markAt(mark, height, halo = 0) {
  if (!halo) return sharp(mark).resize({ height }).png().toBuffer();
  // Work at 4× so the outline's edge is smooth once scaled down.
  const S = 4, r = halo * S;
  const inner = await sharp(mark).resize({ height: (height - 2 * halo) * S }).png().toBuffer();
  const padded = await sharp(inner).extend({ top: r, bottom: r, left: r, right: r, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const { data: a, info } = await sharp(padded).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Grow the shape by r px (a round brush), fill that with the halo colour, lay the mark on top.
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < a.length; i++) solid[i] = a[i] >= 128 ? 1 : 0;
  const grown = Buffer.alloc(w * h);
  const offs = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) offs.push([dx, dy]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid[y * w + x]) continue;
      // Only edge pixels need stamping.
      if (x > 0 && x < w - 1 && y > 0 && y < h - 1 && solid[y * w + x - 1] && solid[y * w + x + 1] && solid[(y - 1) * w + x] && solid[(y + 1) * w + x]) { grown[y * w + x] = 255; continue; }
      for (const [dx, dy] of offs) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && X < w && Y >= 0 && Y < h) grown[Y * w + X] = 255;
      }
    }
  }
  const ring = await sharp({ create: { width: w, height: h, channels: 3, background: HALO } }).joinChannel(grown, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
  const big = await sharp(ring).composite([{ input: padded }]).png().toBuffer();
  return sharp(big).resize({ height }).png().toBuffer();
}

/** A square icon: the mark centred with a little room, on a background (or transparent). */
async function square(mark, size, { halo, background }) {
  const pad = Math.round(size * 0.04);
  const m = await markAt(mark, size, halo);
  const fitted = await sharp(m).resize({ width: size - 2 * pad, height: size - 2 * pad, fit: 'inside' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fitted, gravity: 'center' }]).png().toBuffer();
}

/** An .ico that holds PNG images (supported by every current browser). */
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, e); head.writeUInt8(size >= 256 ? 0 : size, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(png.length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.png)]);
}

const mark = await cleanMark();
// Header mark: shown 26 px tall, drawn at 6× for sharp screens.
writeFileSync('public/logo.png', await markAt(mark, 156));
writeFileSync('public/logo-dark.png', await markAt(mark, 156, 7));
// Favicons: outlined so they read on dark and light tab strips.
const icons = await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await square(mark, size, { halo: size <= 16 ? 1 : 2 }) })));
writeFileSync('public/favicon.ico', ico(icons));
writeFileSync('public/favicon-192.png', await square(mark, 192, { halo: 6 }));
// iOS home screen: no transparency there, so the dark theme's background.
writeFileSync('public/apple-touch-icon.png', await square(mark, 180, { halo: 5, background: DARK_BG }));
// For scripts/og-image.mjs (dark background).
writeFileSync('scripts/assets/logo-og.png', await markAt(mark, 120, 5));
console.log('wrote public/logo.png, logo-dark.png, favicon.ico, favicon-192.png, apple-touch-icon.png, scripts/assets/logo-og.png');
