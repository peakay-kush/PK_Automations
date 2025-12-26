const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPng = path.join(__dirname, '..', 'public', 'pk-automations-logo.png');
const outWebp = path.join(__dirname, '..', 'public', 'pk-automations-logo.webp');
const thumbPng = path.join(__dirname, '..', 'public', 'pk-automations-logo-thumb.png');
const thumbWebp = path.join(__dirname, '..', 'public', 'pk-automations-logo-thumb.webp');

(async () => {
  if (!fs.existsSync(inputPng)) {
    console.error('Input PNG not found:', inputPng);
    process.exit(1);
  }

  try {
    // Create full-size WebP
    await sharp(inputPng)
      .resize({ width: 800 })
      .webp({ quality: 90 })
      .toFile(outWebp);

    // Create thumbnail PNG
    await sharp(inputPng)
      .resize({ width: 128, height: 128, fit: 'cover' })
      .png({ quality: 90 })
      .toFile(thumbPng);

    // Create thumbnail WebP
    await sharp(inputPng)
      .resize({ width: 128, height: 128, fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(thumbWebp);

    console.log('Logo optimization complete. Files created:');
    console.log(' -', outWebp);
    console.log(' -', thumbPng);
    console.log(' -', thumbWebp);
  } catch (err) {
    console.error('Error optimizing logo:', err);
    process.exit(1);
  }
})();