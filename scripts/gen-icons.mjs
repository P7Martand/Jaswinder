import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#2563eb"/>
  <path d="M42 26v76" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  <path d="M46 30h46l-11 17 11 17H46z" fill="#ffffff"/>
</svg>`;

mkdirSync('icons', { recursive: true });

for (const size of [16, 32, 48, 128]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`icons/${size}.png`);
  console.log(`wrote icons/${size}.png`);
}
