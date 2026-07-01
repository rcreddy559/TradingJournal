// Generates PNG toolbar/app icons for the Chrome extension from a simple
// programmatic "line chart" mark, using only Node built-ins (zlib). Run with:
//   node scripts/generate-extension-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/icons");
const SIZES = [16, 32, 48, 128];

// ---- PNG encoding helpers -------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Drawing --------------------------------------------------------------
function makeIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const setPx = (x, y, [r, g, b, a = 255]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    // simple alpha-over compositing
    const sa = a / 255;
    rgba[i] = Math.round(r * sa + rgba[i] * (1 - sa));
    rgba[i + 1] = Math.round(g * sa + rgba[i + 1] * (1 - sa));
    rgba[i + 2] = Math.round(b * sa + rgba[i + 2] * (1 - sa));
    rgba[i + 3] = Math.max(rgba[i + 3], a);
  };

  const radius = size * 0.22; // rounded-corner radius
  const insideRounded = (x, y) => {
    const rx = Math.min(x + 0.5, size - x - 0.5);
    const ry = Math.min(y + 0.5, size - y - 0.5);
    if (rx >= radius || ry >= radius) return true;
    const dx = radius - rx;
    const dy = radius - ry;
    return dx * dx + dy * dy <= radius * radius;
  };

  // Vertical gradient background inside the rounded rect.
  const top = [22, 41, 58];
  const bottom = [11, 22, 32];
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const col = [
      Math.round(top[0] + (bottom[0] - top[0]) * t),
      Math.round(top[1] + (bottom[1] - top[1]) * t),
      Math.round(top[2] + (bottom[2] - top[2]) * t),
      255,
    ];
    for (let x = 0; x < size; x++) {
      if (insideRounded(x, y)) setPx(x, y, col);
    }
  }

  const disc = (cx, cy, r, color) => {
    const r2 = r * r;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2 && insideRounded(x, y)) setPx(x, y, color);
      }
    }
  };

  const segment = (p0, p1, r, color) => {
    const dist = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const steps = Math.max(1, Math.ceil(dist));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      disc(p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, r, color);
    }
  };

  // Map the 512-space design coordinates to this icon size.
  const s = (v) => (v / 512) * size;
  const pt = (x, y) => [s(x), s(y)];

  const line = [0x4d, 0xb4, 0xff, 255];
  const dot = [0x32, 0xd2, 0x96, 255];
  const base = [0x2e, 0x45, 0x58, 255];

  const lineR = Math.max(1, s(30));
  const baseR = Math.max(0.8, s(9));

  // Baseline.
  segment(pt(96, 400), pt(416, 400), baseR, base);
  // Zig-zag up-trend line.
  const points = [pt(96, 340), pt(200, 236), pt(268, 300), pt(416, 148)];
  for (let i = 0; i < points.length - 1; i++) {
    segment(points[i], points[i + 1], lineR, line);
  }
  // End marker.
  disc(...pt(416, 148), Math.max(1.5, s(34)), dot);

  return encodePng(size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const png = makeIcon(size);
  writeFileSync(resolve(OUT_DIR, `icon${size}.png`), png);
  console.log(`wrote icons/icon${size}.png (${png.length} bytes)`);
}
console.log("Done.");
