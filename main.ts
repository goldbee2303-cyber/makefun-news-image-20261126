// main.ts — checks entry.png and copies it to the output folder.
// The entry is one 1024x1024 PNG. This program confirms the file is a
// complete, well-formed PNG of the right dimensions and type, then copies
// it unchanged into MAKEFUN_OUTPUT_DIR (or "out" when unset).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
const SRC = "entry.png";

function reject(msg: string): never {
  console.error(`entry rejected: ${msg}`);
  process.exit(1);
}

// CRC-32 (IEEE 802.3), table built lazily on first use.
let crcTable: Int32Array | null = null;
function crc32(buf: Buffer): number {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// --- load the file ---
if (!existsSync(SRC)) reject("entry.png is missing");
const bytes = readFileSync(SRC);
if (bytes.length > 1048576) reject(`file is ${bytes.length} bytes, over the 1 MiB cap`);

// --- PNG signature (first 8 bytes) ---
const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
for (let i = 0; i < SIG.length; i++) {
  if (bytes[i] !== SIG[i]) reject("not a PNG file (bad signature)");
}

// --- walk the chunks, verifying each CRC and reading IHDR/IEND ---
let pos = 8;
let width = 0;
let height = 0;
let bitDepth = 0;
let colourType = 0;
let sawIHDR = false;
let sawIEND = false;
let sawIDAT = false;
let idatBytes = 0;

while (pos + 8 <= bytes.length) {
  const len = bytes.readUInt32BE(pos);
  const type = bytes.toString("ascii", pos + 4, pos + 8);
  const dataStart = pos + 8;
  const dataEnd = dataStart + len;
  if (dataEnd + 4 > bytes.length) reject(`chunk ${type} runs past the end of the file`);
  const stored = bytes.readUInt32BE(dataEnd);
  const computed = crc32(bytes.subarray(pos + 4, dataEnd));
  if (stored !== computed) reject(`chunk ${type} has a bad CRC`);
  if (type === "IHDR") {
    if (sawIHDR) reject("duplicate IHDR chunk");
    sawIHDR = true;
    width = bytes.readUInt32BE(dataStart);
    height = bytes.readUInt32BE(dataStart + 4);
    bitDepth = bytes[dataStart + 8];
    colourType = bytes[dataStart + 9];
  } else if (type === "IDAT") {
    sawIDAT = true;
    idatBytes += len;
  } else if (type === "IEND") {
    sawIEND = true;
    if (dataEnd + 4 !== bytes.length) reject("trailing bytes after IEND");
    break;
  }
  pos = dataEnd + 4;
}

if (!sawIHDR) reject("no IHDR chunk");
if (!sawIEND) reject("no IEND chunk (file is truncated)");
if (!sawIDAT || idatBytes === 0) reject("no image data (no IDAT chunk)");
if (width !== 1024 || height !== 1024) reject(`image is ${width}x${height}, must be 1024x1024`);
if (bitDepth !== 8) reject(`bit depth is ${bitDepth}, must be 8`);
if (colourType < 2 || colourType > 6) reject(`colour type ${colourType} is outside 2-6`);

console.log(`entry.png accepted: ${width}x${height}, depth ${bitDepth}, colour ${colourType}, ${bytes.length} bytes`);

// --- copy the file unchanged into the output directory ---
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "entry.png"), bytes);
