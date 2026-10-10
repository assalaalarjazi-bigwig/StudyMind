import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgPath = path.resolve('public/logo.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Web / PWA icons
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/icon-192.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(svgBuffer).resize(32, 32).png().toFile('public/favicon.png');
  console.log('Generated Web/PWA icons: icon-192.png, icon-512.png, favicon.png');

  // 2. Android mipmap icons
  const androidResDir = path.resolve('android/app/src/main/res');
  const sizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const { dir, size } of sizes) {
    const targetDir = path.join(androidResDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    await sharp(svgBuffer).resize(size, size).png().toFile(path.join(targetDir, 'ic_launcher.png'));
    await sharp(svgBuffer).resize(size, size).png().toFile(path.join(targetDir, 'ic_launcher_round.png'));
  }
  console.log('Generated all Android launcher icons (ic_launcher.png, ic_launcher_round.png) in all densities!');
}

generate().catch(console.error);
