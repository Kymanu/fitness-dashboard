// Generates icon-192.png, icon-512.png, and apple-touch-icon.png
// from the lightning-bolt design using only Node.js built-ins.
// Run: node scripts/generate-icons.js

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CRC32 ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG writer ────────────────────────────────────────────────────────────────
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; }

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([u32(data.length), t, data, crcVal]);
}

function writePng(size, rgba) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    rows.push(0); // no filter
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      rows.push(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', Buffer.concat([u32(size), u32(size), Buffer.from([8, 6, 0, 0, 0])])),
    pngChunk('IDAT', deflateSync(Buffer.from(rows), { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Point-in-polygon (ray casting) ───────────────────────────────────────────
function pip(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > py) !== (yj > py)) && px < (xj - xi) * (py - yi) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// Lightning bolt polygon in 512-space (clockwise from top-right point)
const BOLT = [[310, 55], [185, 275], [270, 275], [205, 455], [345, 215], [280, 215]];

// ── Render with 4× supersampling for anti-aliased edges ──────────────────────
function renderIcon(size) {
  const SS = 4;
  const cornerR = size * 0.22;
  const half = size / 2;
  const scale = 512 / size; // map size-space → 512-space for bolt test
  const rgba = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const sx = (x * SS + dx + 0.5) / SS;
          const sy = (y * SS + dy + 0.5) / SS;

          // Rounded-rect test
          const ax = Math.abs(sx - half);
          const ay = Math.abs(sy - half);
          const inRR =
            ax <= half && ay <= half && (
              ax <= half - cornerR || ay <= half - cornerR ||
              Math.hypot(ax - (half - cornerR), ay - (half - cornerR)) <= cornerR
            );

          if (!inRR) { /* transparent */ continue; }

          if (pip(sx * scale, sy * scale, BOLT)) {
            r += 124; g += 106; b += 247; a += 255; // #7c6af7 accent purple
          } else {
            r += 26;  g += 26;  b += 26;  a += 255; // #1a1a1a background
          }
        }
      }

      const n = SS * SS;
      const i = (y * size + x) * 4;
      rgba[i]     = r / n;
      rgba[i + 1] = g / n;
      rgba[i + 2] = b / n;
      rgba[i + 3] = a / n;
    }
  }

  return rgba;
}

// ── Generate ──────────────────────────────────────────────────────────────────
const outDir = join(__dirname, '..', 'public', 'icons');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const sizes = [
  ['icon-192.png',       192],
  ['icon-512.png',       512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of sizes) {
  process.stdout.write(`Rendering ${name} (${size}×${size})...`);
  const png = writePng(size, renderIcon(size));
  writeFileSync(join(outDir, name), png);
  console.log(' done');
}
