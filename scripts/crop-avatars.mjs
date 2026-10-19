// Crops Bitmoji avatars out of a Snapchat screenshot into circular PNGs in public/avatars.
//
//   node scripts/crop-avatars.mjs [screenshot] [spots.json]
//
// spots.json: [{ "name": "c1", "cx": 72, "cy": 390, "r": 51 }, ...] in screenshot pixels.
// Without a spots file, the layout of the original 852×1846 iPhone screenshot is used.
import sharp from 'sharp';
import { existsSync, readFileSync } from 'node:fs';

const SRC = process.argv[2] ?? 'scripts/reference.webp';
const SPOTS = process.argv[3] ?? 'scripts/avatar-spots.json';

let jobs;
if (existsSync(SPOTS)) {
  jobs = JSON.parse(readFileSync(SPOTS, 'utf8'));
} else {
  const rows = [390, 521, 652, 783, 914, 1046, 1177, 1308, 1437, 1567];
  jobs = rows.map((y, i) => ({ name: `c${i + 1}`, cx: 72, cy: y, r: i === 7 ? 46 : 51 }));
  jobs.push({ name: 'me', cx: 61, cy: 181, r: 43 }, { name: 'myai', cx: 66, cy: 283, r: 19 });
}

const OUT = 160;
// read via a buffer: libvips can't open paths longer than Windows' MAX_PATH
const input = readFileSync(SRC);
for (const j of jobs) {
  const size = Math.round(j.r * 2);
  const mask = Buffer.from(`<svg width="${OUT}" height="${OUT}"><circle cx="${OUT / 2}" cy="${OUT / 2}" r="${OUT / 2}" fill="#fff"/></svg>`);
  await sharp(input)
    .extract({ left: Math.round(j.cx - j.r), top: Math.round(j.cy - j.r), width: size, height: size })
    .resize(OUT, OUT, { kernel: 'lanczos3' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(`public/avatars/${j.name}.png`);
  console.log('wrote', j.name);
}
