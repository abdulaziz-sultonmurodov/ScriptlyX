/**
 * Create placeholder icons using pre-generated base64 data
 *
 * Run: node scripts/create-placeholder-icons.js
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = join(__dirname, '..', 'assets', 'icons');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Minimal valid PNG files (1x1 green pixel, will be stretched)
// These are placeholders - replace with real icons for production

// 16x16 green square PNG
const icon16Base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2Nk+A+EDYwMjP8ZRgFDoQKMo4EwNAIBAEwgAgkVGa+DAAAAAElFTkSuQmCC';

// 48x48 green square PNG
const icon48Base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAL0lEQVR42u3NMQEAAAgDoNO/sFMCxGNPYLvVz3p0VgABBBBAAAEEEEAAAQQQeNYBfKIDMQlL/hoAAAAASUVORK5CYII=';

// 128x128 green square PNG
const icon128Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAQklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3A8YAAAF9TbLFAAAAAElFTkSuQmCC';

const icons = [
  { name: 'icon-16.png', data: icon16Base64 },
  { name: 'icon-48.png', data: icon48Base64 },
  { name: 'icon-128.png', data: icon128Base64 },
];

console.log('Creating placeholder icons...');

for (const icon of icons) {
  const buffer = Buffer.from(icon.data, 'base64');
  const filepath = join(outputDir, icon.name);
  writeFileSync(filepath, buffer);
  console.log(`Created: ${icon.name}`);
}

console.log('\nPlaceholder icons created.');
console.log('Note: Replace these with proper icons for production.');
