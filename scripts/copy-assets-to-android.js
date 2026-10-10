import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function syncAssets() {
  const distDir = path.resolve(projectRoot, 'dist');
  const targetDir = path.resolve(projectRoot, 'android/app/src/main/assets');

  if (!fs.existsSync(distDir)) {
    console.error(`Error: dist folder does not exist at "${distDir}"! Run "npm run build" first.`);
    process.exit(1);
  }

  // Ensure clean target directory
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy all dist files into android/app/src/main/assets
  copyDirSync(distDir, targetDir);

  const copiedFiles = fs.readdirSync(targetDir);
  console.log(`Successfully synced assets from "${distDir}" to "${targetDir}"`);
  console.log(`Total items in assets root: ${copiedFiles.length} (${copiedFiles.join(', ')})`);

  // Verify critical files
  const indexHtml = path.join(targetDir, 'index.html');
  const assetsFolder = path.join(targetDir, 'assets');
  if (!fs.existsSync(indexHtml)) {
    console.error('Critical verification failed: index.html is missing from assets!');
    process.exit(1);
  }
  if (!fs.existsSync(assetsFolder)) {
    console.error('Critical verification failed: assets folder is missing from assets!');
    process.exit(1);
  }

  const jsCssFiles = fs.readdirSync(assetsFolder);
  console.log(`Assets subfolder contains: ${jsCssFiles.join(', ')}`);
  console.log('Verification passed: All React app assets (HTML, JS, CSS) packaged successfully!');
}

syncAssets();
