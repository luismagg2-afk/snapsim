// Converts the Apple emoji PNGs from emoji-datasource-apple into small WebP files in
// public/emoji/ and writes src/emojiMap.json (codepoints without FE0F -> file name).
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = 'node_modules/emoji-datasource-apple/img/apple/64/';
const OUT = 'public/emoji/';
mkdirSync(OUT, { recursive: true });
const data = JSON.parse(readFileSync('node_modules/emoji-datasource-apple/emoji.json', 'utf8'));
const norm = (u) => u.toLowerCase().split('-').filter((c) => c !== 'fe0f').join('-');
const map = {};
const jobs = [];
const add = (unified, image, has) => {
  if (!has || !existsSync(SRC + image)) return;
  const name = image.replace(/\.png$/, '');
  map[norm(unified)] = name;
  jobs.push(name);
};
for (const e of data) {
  add(e.unified, e.image, e.has_img_apple);
  if (e.non_qualified && existsSync(SRC + e.image)) map[norm(e.non_qualified)] ??= e.image.replace(/\.png$/, '');
  for (const v of Object.values(e.skin_variations ?? {})) add(v.unified, v.image, v.has_img_apple);
}
let done = 0;
const queue = [...new Set(jobs)];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const name = queue.pop();
      // buffers instead of paths: libvips can't open paths longer than Windows' MAX_PATH
      const buf = await sharp(readFileSync(SRC + name + '.png')).resize(64, 64).webp({ quality: 82, alphaQuality: 90 }).toBuffer();
      writeFileSync(OUT + name + '.webp', buf);
      done++;
    }
  }),
);
// Only the file names are stored; the app derives the lookup key by dropping FE0F.
writeFileSync('src/emojiMap.json', JSON.stringify([...new Set(Object.values(map))].sort()));
console.log(`converted ${done} emoji, ${Object.keys(map).length} map entries`);
