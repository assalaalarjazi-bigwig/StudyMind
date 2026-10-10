import fs from 'fs';
import path from 'path';

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
  const distDir = path.resolve('dist');
  const targetDir = path.resolve('android/app/src/main/assets');

  if (!fs.existsSync(distDir)) {
    console.error('Error: dist folder does not exist! Run "npm run build" first.');
    process.exit(1);
  }

  // Ensure clean target directory
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy all dist files into android/app/src/main/assets
  copyDirSync(distDir, targetDir);

  console.log(`Successfully synced assets from "${distDir}" to "${targetDir}"`);
  console.log(`Total files copied:`, fs.readdirSync(targetDir));
}

syncAssets();
