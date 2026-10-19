// Generates the PWA icons (a generic yellow chat-bubble mark, not a Snapchat logo).
import sharp from 'sharp';
const svg = (s, pad) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
<rect width="100" height="100" fill="#FFFC00"/>
<g transform="translate(${pad} ${pad}) scale(${(100 - 2 * pad) / 100})">
<path d="M22 24h56a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H46L30 82V70h-8a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8z" fill="#fff" stroke="#000" stroke-width="5" stroke-linejoin="round"/>
<circle cx="36" cy="47" r="4.5"/><circle cx="50" cy="47" r="4.5"/><circle cx="64" cy="47" r="4.5"/></g></svg>`);
for (const [name, s, pad] of [['icon-192.png', 192, 6], ['icon-512.png', 512, 6], ['maskable-512.png', 512, 18], ['apple-touch-icon.png', 180, 6]]) {
  await sharp(svg(s, pad)).png().toFile(`public/icons/${name}`);
}
console.log('icons done');
