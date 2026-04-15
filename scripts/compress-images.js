const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'public', 'images');
const outputDir = path.join(__dirname, '..', 'public', 'images');

async function compressImages() {
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;

    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));

    console.log(`Processing: ${file}...`);

    try {
      const metadata = await sharp(inputPath).metadata();
      let pipeline = sharp(inputPath);

      // Resize large images
      if (file.includes('board')) {
        pipeline = pipeline.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true });
      } else {
        pipeline = pipeline.resize(200, 200, { fit: 'cover' });
      }

      await pipeline
        .webp({ quality: 80 })
        .toFile(outputPath);

      const originalSize = fs.statSync(inputPath).size;
      const compressedSize = fs.statSync(outputPath).size;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      console.log(`  ${file} -> ${file.replace(/\.(png|jpg|jpeg)$/i, '.webp')} (${ratio}% smaller)`);
    } catch (err) {
      console.error(`  Error processing ${file}:`, err.message);
    }
  }

  console.log('Done!');
}

compressImages();
