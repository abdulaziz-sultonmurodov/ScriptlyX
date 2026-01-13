/**
 * Package extension for Chrome Web Store submission
 *
 * Run: npm run package
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read version from manifest.json
const manifest = JSON.parse(readFileSync(join(rootDir, 'manifest.json'), 'utf-8'));
const version = manifest.version;

const distDir = join(rootDir, 'dist');
const zipPath = join(distDir, `scriptlyx-v${version}.zip`);

// Files/folders to include in the package
const includeList = [
  'manifest.json',
  'build',
  'src/popup/popup.html',
  'src/popup/popup.css',
  'assets/icons',
];

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const output = createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`\nPackage created: dist/scriptlyx-v${version}.zip`);
  console.log(`Total size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
  console.log('\nNext steps:');
  console.log('1. Go to https://chrome.google.com/webstore/devconsole');
  console.log('2. Click "New Item"');
  console.log('3. Upload the ZIP file');
  console.log('4. Fill in the store listing details');
  console.log('5. Submit for review');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add files to archive
for (const item of includeList) {
  const fullPath = join(rootDir, item);

  if (!existsSync(fullPath)) {
    console.warn(`Warning: ${item} not found, skipping...`);
    continue;
  }

  const stats = statSync(fullPath);

  if (stats.isDirectory()) {
    archive.directory(fullPath, item);
    console.log(`Added directory: ${item}`);
  } else {
    archive.file(fullPath, { name: item });
    console.log(`Added file: ${item}`);
  }
}

archive.finalize();
