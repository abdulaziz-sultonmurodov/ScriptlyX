/**
 * Generate PNG icons for the extension
 *
 * This script creates simple placeholder icons.
 * For production, replace with professionally designed icons.
 *
 * Run: node scripts/generate-icons.js
 *
 * Note: Requires 'canvas' package: npm install canvas
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 48, 128];
const outputDir = join(__dirname, '..', 'assets', 'icons');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background with rounded corners
  const radius = size * 0.15;
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Letter "S"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size * 0.45, size * 0.5);

  // Letter "X" (smaller, in corner)
  if (size >= 48) {
    ctx.font = `bold ${size * 0.22}px Arial`;
    ctx.fillText('X', size * 0.78, size * 0.75);
  }

  return canvas.toBuffer('image/png');
}

console.log('Generating icons...');

for (const size of sizes) {
  const buffer = generateIcon(size);
  const filename = `icon-${size}.png`;
  const filepath = join(outputDir, filename);

  writeFileSync(filepath, buffer);
  console.log(`Created: ${filename}`);
}

console.log('\nDone! Icons saved to assets/icons/');
