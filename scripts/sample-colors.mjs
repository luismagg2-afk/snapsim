// Prints the size of a screenshot and the colour at given pixels.
//   node scripts/sample-colors.mjs <image> x,y [x,y ...]
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const [img, ...pts] = process.argv.slice(2);
const { data, info } = await sharp(readFileSync(img)).raw().toBuffer({ resolveWithObject: true });
console.log(`size ${info.width}x${info.height}`);
for (const p of pts) {
  const [x, y] = p.split(',').map(Number);
  const i = (y * info.width + x) * info.channels;
  console.log(p, '#' + [0, 1, 2].map((c) => data[i + c].toString(16).padStart(2, '0')).join(''));
}
