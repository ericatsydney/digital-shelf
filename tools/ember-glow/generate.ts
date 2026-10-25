import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const size = 128;
const output = resolve('public/textures/ember-glow.png');

/** Bakes a soft orange radial glow (RGBA) used for nearly burnt-out fires; no browser needed. */
function crc32(buffer: Buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const rows = Buffer.alloc((size * 4 + 1) * size);
for (let y = 0; y < size; y += 1) {
  rows[y * (size * 4 + 1)] = 0;
  for (let x = 0; x < size; x += 1) {
    const distance = Math.min(1, Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2));
    const glow = (1 - distance) ** 2.2;
    const hot = (1 - distance) ** 5;
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    rows[offset] = Math.round(255);
    rows[offset + 1] = Math.round(110 + 110 * hot);
    rows[offset + 2] = Math.round(30 + 90 * hot);
    rows[offset + 3] = Math.round(255 * glow);
  }
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(rows)),
  chunk('IEND', Buffer.alloc(0)),
]);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, png);
console.log(`Wrote ${output}`);
