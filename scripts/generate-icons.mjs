import sharp from 'sharp';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const ICON_DIR = resolve('assets/icons');

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#bg)"/>
  <g transform="translate(64,64)">
    <!-- Lightning bolt -->
    <path d="M-8,-32 L8,-32 L2,-8 L14,-8 L-6,32 L0,8 L-14,8 Z" fill="white" opacity="0.95"/>
    <!-- Document corner -->
    <rect x="20" y="-36" width="20" height="26" rx="3" fill="white" opacity="0.3"/>
    <path d="M20,-36 L40,-36 L40,-10" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>
  </g>
</svg>`;

const svgIcon16 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="16" height="16" rx="3" fill="url(#bg)"/>
  <path d="M-1,-4 L2,-4 L1,-1 L3,-1 L-1,5 L0,2 L-2,2 Z" fill="white" transform="translate(8,7) scale(0.5)" opacity="0.95"/>
</svg>`;

async function generateIcons() {
  await mkdir(ICON_DIR, { recursive: true });

  const sizes = [16, 48, 128];

  for (const size of sizes) {
    const svg = size === 16 ? svgIcon16 : svgIcon;
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(resolve(ICON_DIR, `icon${size}.png`));
    console.log(`Generated icon${size}.png`);
  }

  // Also generate a favicon-style icon for the options/popup pages
  const faviconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="6" fill="url(#bg)"/>
    <path d="M-2,-8 L4,-8 L1,-2 L6,-2 L-2,12 L0,4 L-4,4 Z" fill="white" transform="translate(16,14) scale(0.8)" opacity="0.95"/>
  </svg>`;

  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(resolve(ICON_DIR, 'favicon.png'));
  console.log('Generated favicon.png');
}

generateIcons().catch(console.error);
