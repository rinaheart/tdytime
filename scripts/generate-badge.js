import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../package.json');
const badgeDir = path.join(__dirname, '../public/badges');
const badgePath = path.join(badgeDir, 'version.svg');

try {
  // 1. Read version from package.json
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);
  const version = `v${packageJson.version}`;

  if (!version) {
    throw new Error('Version not found in package.json');
  }

  // 2. Ensure badge directory exists
  if (!fs.existsSync(badgeDir)) {
    fs.mkdirSync(badgeDir, { recursive: true });
  }

  // 3. Generate SVG content (similar to Shields.io style)
  // We calculate width dynamically based on version string length for better fit
  const leftWidth = 51; // width for "version"
  const charWidth = 7; // approximate width per character
  const padding = 10;
  const rightWidth = Math.max(40, (version.length * charWidth) + padding);
  const totalWidth = leftWidth + rightWidth;
  const rightXOffset = leftWidth + (rightWidth / 2);

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="version: ${version}">
  <title>version: ${version}</title>
  <filter id="blur"><feGaussianBlur in="SourceGraphic" stdDeviation="16"/></filter>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="#007ec6"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="265" y="150" fill="#010101" fill-opacity=".80" filter="url(#blur)" transform="scale(.1)" textLength="410">version</text>
    <text aria-hidden="true" x="265" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="410">version</text>
    <text x="265" y="140" transform="scale(.1)" fill="#fff" textLength="410">version</text>
    <text aria-hidden="true" x="${rightXOffset * 10}" y="150" fill="#010101" fill-opacity=".80" filter="url(#blur)" transform="scale(.1)" textLength="${(rightWidth - padding) * 10}">${version}</text>
    <text aria-hidden="true" x="${rightXOffset * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(rightWidth - padding) * 10}">${version}</text>
    <text x="${rightXOffset * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(rightWidth - padding) * 10}">${version}</text>
  </g>
</svg>`;

  // 4. Write the SVG file
  fs.writeFileSync(badgePath, svgContent, 'utf-8');
  console.log(`✅ Version badge generated successfully: public/badges/version.svg (${version})`);

} catch (error) {
  console.error('❌ Error generating version badge:', error.message);
  process.exit(1);
}
