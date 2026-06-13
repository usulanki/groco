/**
 * Script: Download placeholder images from Picsum Photos and assign them
 * to all product variants that currently have no images.
 *
 * - 3 images per variant
 * - First image marked as primary
 * - Skips variants that already have images (safe to re-run)
 * - Uses deterministic seed so same product always gets same images
 *
 * Run: npx tsx src/scripts/seedProductImages.ts
 */
import https from "https";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sequelize from "../config/database";

const IMAGES_PER_VARIANT = 3;
const STORE_ID = 1;
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "media");

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function downloadImage(url: string, destPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Follow redirects (Picsum returns 302)
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        downloadImage(response.headers.location!, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = fs.statSync(destPath).size;
        resolve(size);
      });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");
    ensureUploadDir();

    // Load all products with their variants
    const [products] = await sequelize.query(
      `SELECT p.id, p.name
       FROM products p
       WHERE p.is_deleted = 0
       ORDER BY p.id ASC`
    ) as [Array<{ id: number; name: string }>, unknown];

    console.log(`Found ${products.length} products.\n`);

    let totalImages = 0;
    let skipped = 0;

    for (const product of products) {
      const [variants] = await sequelize.query(
        `SELECT id FROM product_variants WHERE product_id = ? AND is_deleted = 0 ORDER BY id ASC`,
        { replacements: [product.id] }
      ) as [Array<{ id: number }>, unknown];

      if (variants.length === 0) {
        console.log(`  SKIP [${product.id}] "${product.name}" — no variants`);
        skipped++;
        continue;
      }

      let productHadWork = false;

      for (const variant of variants) {
        // Skip if variant already has images
        const [existing] = await sequelize.query(
          `SELECT id FROM product_media WHERE product_id = ? AND variant_id = ? LIMIT 1`,
          { replacements: [product.id, variant.id] }
        ) as [Array<{ id: number }>, unknown];

        if (existing.length > 0) continue;

        productHadWork = true;
        let imagesAdded = 0;

        for (let i = 0; i < IMAGES_PER_VARIANT; i++) {
          const seed = `${product.id}-${variant.id}-${i}`;
          const url = `https://picsum.photos/seed/${seed}/800/800`;
          const filename = `${crypto.randomUUID()}.jpg`;
          const destPath = path.join(UPLOAD_DIR, filename);

          try {
            const size = await downloadImage(url, destPath);
            const filePath = `/uploads/media/${filename}`;

            // Insert media record
            const [mediaId] = await sequelize.query(
              `INSERT INTO media (filename, original_name, path, mime_type, size, store_id, created_ts, updated_ts)
               VALUES (?, ?, ?, 'image/jpeg', ?, ?, NOW(), NOW())`,
              { replacements: [filename, `product-${product.id}-${i + 1}.jpg`, filePath, size, STORE_ID] }
            ) as unknown as [number, unknown];

            // Insert product_media record
            const isPrimary = i === 0 ? 1 : 0;
            await sequelize.query(
              `INSERT INTO product_media (product_id, media_id, variant_id, sort_order, is_primary)
               VALUES (?, ?, ?, ?, ?)`,
              { replacements: [product.id, mediaId, variant.id, i, isPrimary] }
            );

            imagesAdded++;
            totalImages++;
          } catch (err) {
            console.error(`  ERROR downloading image for product ${product.id} variant ${variant.id} image ${i}:`, err);
          }
        }

        if (imagesAdded > 0) {
          console.log(`  [${product.id}] "${product.name}" → variant ${variant.id}: ${imagesAdded} images added`);
        }
      }

      if (!productHadWork) skipped++;
    }

    console.log(`\nDone. Added ${totalImages} images total. Skipped ${skipped} products (already had images or no variants).`);
    await sequelize.close();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
