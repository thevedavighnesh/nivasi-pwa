/**
 * PWA Icon Generator Script
 * 
 * This script creates PWA icons in various sizes.
 * 
 * Prerequisites:
 * - Install sharp: npm install sharp --save-dev
 * - Place your source icon (minimum 512x512) as 'source-icon.png' in the project root
 * 
 * Usage:
 * - node generate-pwa-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✓ Created icons directory');
}

// Check if sharp is installed
let sharp;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default;
} catch (error) {
  console.log('⚠️  Sharp is not installed.');
  console.log('Run: npm install sharp --save-dev');
  console.log('\nAlternatively, you can create icons manually or use online tools like:');
  console.log('- https://realfavicongenerator.net/');
  console.log('- https://www.pwabuilder.com/imageGenerator');
  createPlaceholderIcons();
  process.exit(0);
}

// Source icon path
const sourceIconPath = path.join(__dirname, 'source-icon.png');

if (!fs.existsSync(sourceIconPath)) {
  console.log('⚠️  Source icon not found!');
  console.log('\nTo generate icons, please:');
  console.log('1. Create a 512x512 PNG icon named "source-icon.png" in the project root');
  console.log('2. Run this script again: node generate-pwa-icons.js');
  console.log('\nAlternatively, use online tools to generate icons:');
  console.log('- https://realfavicongenerator.net/');
  console.log('- https://www.pwabuilder.com/imageGenerator');
  
  // Create a placeholder SVG icon
  createPlaceholderIcons();
  process.exit(0);
}

// Generate icons in different sizes
async function generateIcons() {
  console.log('📱 Generating PWA icons...\n');
  
  try {
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(sourceIconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${size}x${size} icon`);
    }
    
    console.log('\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

function createPlaceholderIcons() {
  console.log('\n📱 Creating placeholder icons...\n');
  
  // Create a simple SVG as a placeholder
  const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1a202c"/>
  <text x="50%" y="50%" font-size="300" text-anchor="middle" dominant-baseline="middle" fill="white">🏢</text>
</svg>
  `.trim();
  
  // Save the SVG
  const svgPath = path.join(iconsDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgIcon);
  console.log('✓ Created placeholder SVG icon');
  
  console.log('\n⚠️  Placeholder created. For production, please generate proper PNG icons:');
  console.log('1. Create a 512x512 PNG icon named "source-icon.png" in the project root');
  console.log('2. Run: node generate-pwa-icons.js');
  console.log('\nOr use online tools:');
  console.log('- https://realfavicongenerator.net/');
  console.log('- https://www.pwabuilder.com/imageGenerator');
}

// Run the generator
if (fs.existsSync(sourceIconPath)) {
  generateIcons();
}
