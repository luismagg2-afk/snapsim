// Puts every cropped avatar from public/avatars side by side so the crops can be checked.
//   node scripts/contact-sheet.mjs [out.png]
import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const out = process.argv[2] ?? 'avatar-sheet.png';
const files = readdirSync('public/avatars').filter((f) => f.endsWith('.png')).sort();
const cols = 6;
const comps = files.map((f, i) => ({ input: `public/avatars/${f}`, left: (i % cols) * 170, top: Math.floor(i / cols) * 170 }));
await sharp({ create: { width: cols * 170, height: Math.ceil(files.length / cols) * 170, channels: 4, background: '#222' } })
  .composite(comps)
  .png()
  .toFile(out);
console.log(`${files.length} avatars -> ${out}:`, files.join(', '));
