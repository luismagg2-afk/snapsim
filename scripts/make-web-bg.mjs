// Cuts the right-hand panel (forest + Bitmoji) out of a Snapchat Web screenshot and paints over the
// centre card's camera circle and text with the card's own gradient, so the app can draw them live.
//   node scripts/make-web-bg.mjs <screenshot> <panelX,panelY,panelW,panelH> <cardX,cardY,cardW,cardH>
// Coordinates are screenshot pixels. Output: public/web-bg.webp
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const [src, panelArg, cardArg] = process.argv.slice(2);
const [px, py, pw, ph] = panelArg.split(',').map(Number);
const [cx, cy, cw, ch] = cardArg.split(',').map(Number);

const { data, info } = await sharp(readFileSync(src))
  .extract({ left: px, top: py, width: pw, height: ph })
  .raw()
  .toBuffer({ resolveWithObject: true });
const C = info.channels;
const at = (x, y) => (y * pw + x) * C;

// card in panel coordinates; sample 4px inside the border on each side
const x0 = cx - px, y0 = cy - py;
const L = x0 + 4, R = x0 + cw - 5;
for (let y = y0 + 1; y < y0 + ch - 1; y++) {
  const l = at(L, y), r = at(R, y);
  for (let x = x0 + 2; x < x0 + cw - 2; x++) {
    // keep the card's rounded corners (radius ≈ 24px) from the original pixels
    const RAD = 26;
    const dx = Math.max(x0 + RAD - x, x - (x0 + cw - 1 - RAD), 0);
    const dy = Math.max(y0 + RAD - y, y - (y0 + ch - 1 - RAD), 0);
    if (Math.hypot(dx, dy) > RAD - 3) continue;
    const t = (x - L) / (R - L);
    const i = at(x, y);
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[l + c] * (1 - Math.min(1, Math.max(0, t))) + data[r + c] * Math.min(1, Math.max(0, t)));
  }
}
await sharp(data, { raw: { width: pw, height: ph, channels: C } }).removeAlpha().webp({ quality: 88 }).toFile('public/web-bg.webp');
console.log(`public/web-bg.webp ${pw}x${ph}; card at ${(((cx - px) / pw) * 100).toFixed(2)}% ${(((cy - py) / ph) * 100).toFixed(2)}% size ${((cw / pw) * 100).toFixed(2)}% x ${((ch / ph) * 100).toFixed(2)}%`);
