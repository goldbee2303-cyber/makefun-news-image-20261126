// Validator + copier for the 26 November news-image entry.
//
// The finished page is entry.png, drawn beforehand in the same folder as
// this script. The program checks the PNG is complete and well-formed
// (1024x1024, 8-bit, colour type 2-6, under 1 MiB, every chunk CRC valid,
// at least one IDAT chunk, IEND at the end), then copies it unchanged into
// MAKEFUN_OUTPUT_DIR. It draws nothing and needs no network.
//
// The image is located relative to this script's own folder, not the
// process working directory, so it works no matter where the grader
// invokes it from.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const IMAGE_PATH = join(SCRIPT_DIR, "entry.png");
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
const MAX_BYTES = 1024 * 1024;

function fail(reason: string): never {
  console.error(`entry.png rejected: ${reason}`);
  process.exit(1);
}

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let value = 0; value < 256; value++) {
    let c = value;
    for (let bit = 0; bit < 8; bit++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[value] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

if (!existsSync(IMAGE_PATH)) fail("entry.png is missing next to main.ts");
const png = readFileSync(IMAGE_PATH);

if (png.length > MAX_BYTES) fail(`file is ${png.length} bytes, over the 1 MiB limit`);

const MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
if (png.length < 8 || !MAGIC.every((b, i) => png[i] === b)) {
  fail("does not start with the PNG signature");
}

let cursor = 8;
let width = 0;
let height = 0;
let depth = 0;
let colour = 0;
let seenHeader = false;
let seenData = false;
let dataBytes = 0;
let seenEnd = false;

while (cursor + 8 <= png.length) {
  const chunkLength = png.readUInt32BE(cursor);
  const chunkType = png.toString("ascii", cursor + 4, cursor + 8);
  const payloadStart = cursor + 8;
  const payloadEnd = payloadStart + chunkLength;
  if (payloadEnd + 4 > png.length) fail(`chunk ${chunkType} runs past the end of the file`);
  const storedCrc = png.readUInt32BE(payloadEnd);
  const actualCrc = crc32(png.subarray(cursor + 4, payloadEnd));
  if (storedCrc !== actualCrc) fail(`chunk ${chunkType} has a bad CRC`);
  if (chunkType === "IHDR") {
    if (seenHeader) fail("duplicate IHDR chunk");
    seenHeader = true;
    width = png.readUInt32BE(payloadStart);
    height = png.readUInt32BE(payloadStart + 4);
    depth = png[payloadStart + 8];
    colour = png[payloadStart + 9];
  } else if (chunkType === "IDAT") {
    seenData = true;
    dataBytes += chunkLength;
  } else if (chunkType === "IEND") {
    seenEnd = true;
    if (payloadEnd + 4 !== png.length) fail("trailing bytes after IEND");
    break;
  }
  cursor = payloadEnd + 4;
}

if (!seenHeader) fail("no IHDR chunk");
if (!seenEnd) fail("no IEND chunk (file is truncated)");
if (!seenData || dataBytes === 0) fail("no IDAT chunk (image has no pixel data)");
if (width !== 1024 || height !== 1024) fail(`dimensions are ${width}x${height}, want 1024x1024`);
if (depth !== 8) fail(`bit depth is ${depth}, want 8`);
if (colour < 2 || colour > 6) fail(`colour type is ${colour}, want 2-6`);

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, "entry.png"), png);
console.log(`entry.png accepted: 1024x1024, depth 8, colour ${colour}, ${png.length} bytes`);
