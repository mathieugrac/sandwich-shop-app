#!/usr/bin/env node

/**
 * Creates simple placeholder images for the sandwich products
 * This is a temporary solution until you add real product photos
 */

const fs = require('fs');
const path = require('path');

// Simple SVG placeholder generator
function createPlaceholderSVG(productName, color) {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="${color}"/>
  <text x="400" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">
    ${productName}
  </text>
  <text x="400" y="340" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white" opacity="0.8">
    Placeholder Image
  </text>
</svg>`;
}

async function createPlaceholders() {
  console.log('🎨 Creating placeholder images...\n');

  const imagesDir = path.join(__dirname, '..', 'public', 'sample-images');

  // Ensure directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const placeholders = [
    { name: 'Nutty Beet', filename: 'nutty-beet.svg', color: '#8B4513' }, // Brown
    { name: 'Umami Mush', filename: 'umami-mush.svg', color: '#6B4423' }, // Dark brown
    { name: 'Burgundy Beef', filename: 'burgundy-beef.svg', color: '#800020' }, // Burgundy
  ];

  for (const placeholder of placeholders) {
    const svgContent = createPlaceholderSVG(
      placeholder.name,
      placeholder.color
    );
    const filePath = path.join(imagesDir, placeholder.filename);

    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created ${placeholder.filename}`);
  }

  console.log('\n🎉 Placeholder images created!');
  console.log('\n📝 Next steps:');
  console.log(
    '1. Replace these SVG files with real JPG/PNG images of your products'
  );
  console.log(
    '2. Update the PRODUCT_IMAGES mapping in scripts/seed-images.js if needed'
  );
  console.log('3. Run: npm run seed:images');
}

createPlaceholders().catch(console.error);
