/**
 * Generate minimal valid test images for E2E tests.
 * All images are PNG format for reliable dimension control.
 * JPEG/GIF/WebP files are also PNGs renamed - browsers handle this fine.
 */
import fs from 'fs';
import path from 'path';
import { deflateSync } from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, 'fixtures', 'images');

fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(path.join(imagesDir, 'thumbs'), { recursive: true });

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  const ihdr = pngChunk('IHDR', ihdrData);

  // Create image data: each row = filter byte (0) + RGB pixels
  const rowSize = 1 + width * 3;
  const rawRow = Buffer.alloc(rowSize);
  rawRow[0] = 0; // no filter
  for (let x = 0; x < width; x++) {
    rawRow[1 + x * 3] = r;
    rawRow[2 + x * 3] = g;
    rawRow[3 + x * 3] = b;
  }
  const rawData = Buffer.concat(Array(height).fill(rawRow));
  const compressed = deflateSync(rawData);
  const idat = pngChunk('IDAT', compressed);
  const iend = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// All images as PNG (browsers detect format from magic bytes, not extension)
const images = [
  { name: 'basic-photo.jpg', w: 800, h: 600, r: 255, g: 0, b: 0 },
  { name: 'basic-icon.png', w: 64, h: 64, r: 0, g: 0, b: 255 },
  { name: 'srcset-small.jpg', w: 400, h: 300, r: 0, g: 128, b: 0 },
  { name: 'srcset-medium.jpg', w: 800, h: 600, r: 0, g: 160, b: 0 },
  { name: 'srcset-large.jpg', w: 1600, h: 1200, r: 0, g: 200, b: 0 },
  { name: 'picture-webp.webp', w: 800, h: 600, r: 255, g: 255, b: 0 },
  { name: 'picture-large.jpg', w: 800, h: 600, r: 200, g: 200, b: 0 },
  { name: 'picture-fallback.jpg', w: 800, h: 600, r: 180, g: 180, b: 0 },
  { name: 'lazy-photo.jpg', w: 800, h: 600, r: 128, g: 0, b: 128 },
  { name: 'lazy-photo-2.jpg', w: 600, h: 400, r: 160, g: 0, b: 160 },
  { name: 'bg-hero.jpg', w: 800, h: 400, r: 255, g: 128, b: 0 },
  { name: 'bg-card.png', w: 300, h: 200, r: 0, g: 255, b: 255 },
  { name: 'tiny-spacer.gif', w: 1, h: 1, r: 255, g: 255, b: 255 },
  { name: 'tiny-tracker.png', w: 5, h: 5, r: 255, g: 255, b: 255 },
  { name: 'data-original-photo.jpg', w: 500, h: 500, r: 255, g: 192, b: 203 },
  // Full-size resolution test images (thumbnails vs full-size must differ in dimensions)
  { name: 'thumbs/tn_IMG_0003.jpg', w: 200, h: 150, r: 100, g: 80, b: 60 },
  { name: 'IMG_0003.jpg', w: 1024, h: 768, r: 100, g: 80, b: 60 },
  { name: 'thumbs/tn_IMG_0006.jpg', w: 200, h: 150, r: 60, g: 80, b: 100 },
  { name: 'IMG_0006.jpg', w: 1024, h: 768, r: 60, g: 80, b: 100 },
  { name: '55145287496_a240db048f.jpg', w: 400, h: 300, r: 80, g: 100, b: 60 },
  { name: '55145287496_full.jpg', w: 1024, h: 768, r: 80, g: 100, b: 60 },
  { name: 'photo_d.webp', w: 300, h: 400, r: 120, g: 90, b: 70 },
  { name: 'photo.webp', w: 800, h: 1067, r: 120, g: 90, b: 70 },
  { name: 'photo-thumb.png', w: 100, h: 100, r: 70, g: 120, b: 90 },
  { name: 'photo-full.png', w: 800, h: 800, r: 70, g: 120, b: 90 },
  { name: 'landscape_thumb.jpg', w: 300, h: 200, r: 90, g: 70, b: 120 },
  { name: 'landscape.jpg', w: 1200, h: 800, r: 90, g: 70, b: 120 },
];

for (const img of images) {
  const data = createPng(img.w, img.h, img.r, img.g, img.b);
  const filePath = path.join(imagesDir, img.name);
  fs.writeFileSync(filePath, data);
  const kb = (data.length / 1024).toFixed(1);
  console.log(`Created ${img.name} (${img.w}x${img.h}, ${kb}KB)`);
}

console.log('\nAll test images generated!');
