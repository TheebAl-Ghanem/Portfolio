import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'public', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'manifest.json');

const MEDIA_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.webm',
  '.m4v',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif'
]);

const isHidden = (name) => name.startsWith('.');

const naturalSort = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

async function listDirectoryNames(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !isHidden(entry.name))
    .map((entry) => entry.name)
    .sort(naturalSort);
}

async function listMediaFiles(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && !isHidden(entry.name))
    .map((entry) => entry.name)
    .filter((fileName) => MEDIA_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort(naturalSort);
}

async function buildManifest() {
  const folders = await listDirectoryNames(DATA_DIR);
  const campaigns = [];

  for (const folderName of folders) {
    const folderPath = path.join(DATA_DIR, folderName);
    const files = await listMediaFiles(folderPath);

    if (files.length > 0) {
      campaigns.push({ folderName, files });
    }
  }

  return { campaigns };
}

export async function generateManifest() {
  const manifest = await buildManifest();
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return manifest;
}

async function main() {
  try {
    const manifest = await generateManifest();
    console.log(`Generated ${path.relative(ROOT, OUTPUT_FILE)} with ${manifest.campaigns.length} campaigns.`);
  } catch (error) {
    console.error('Failed to generate data manifest:', error);
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main();
}
