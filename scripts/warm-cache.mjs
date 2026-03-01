#!/usr/bin/env node
// Cache warming script — pre-generates thumbnails for all seed images
// Run after deployment: node scripts/warm-cache.mjs

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const IMAGES_DIR = path.join(process.cwd(), "content", "images");
const CACHE_DIR = path.join(process.cwd(), "content", "cache");

const THUMB_WIDTH = 400;
const THUMB_QUALITY = 70;

async function warmCache() {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const files = await fs.readdir(IMAGES_DIR);
  const webpFiles = files.filter((f) => f.endsWith(".webp"));

  console.log(`Found ${webpFiles.length} images to process...\n`);

  let created = 0;
  let skipped = 0;

  for (const file of webpFiles) {
    const id = file.replace(".webp", "");
    const thumbPath = path.join(CACHE_DIR, `thumb-${id}.webp`);

    // Skip if thumbnail already exists
    try {
      await fs.access(thumbPath);
      skipped++;
      console.log(`  SKIP  ${id} (cached)`);
      continue;
    } catch {
      // Not cached, generate
    }

    const originalPath = path.join(IMAGES_DIR, file);
    const buffer = await sharp(originalPath)
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();

    await fs.writeFile(thumbPath, buffer);
    created++;

    const origStat = await fs.stat(originalPath);
    const ratio = ((buffer.length / origStat.size) * 100).toFixed(1);
    console.log(
      `  OK    ${id} (${(origStat.size / 1024).toFixed(0)}KB → ${(buffer.length / 1024).toFixed(0)}KB, ${ratio}%)`
    );
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

warmCache().catch((err) => {
  console.error("Cache warming failed:", err);
  process.exit(1);
});
