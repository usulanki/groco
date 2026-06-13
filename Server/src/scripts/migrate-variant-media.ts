/**
 * Migration: product_media.variant_id NOT NULL
 *
 * Images are now always attached to a variant, not directly to a product.
 * This script removes any product_media rows that have no variant_id (orphaned
 * product-level images), then alters the column to NOT NULL.
 *
 * Run once:  npx tsx src/scripts/migrate-variant-media.ts
 * Then:      npx tsx src/scripts/sync.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected.");

    const [orphaned] = await sequelize.query(
      "SELECT COUNT(*) as count FROM product_media WHERE variant_id IS NULL"
    );
    const count = (orphaned as any)[0].count;
    console.log(`Found ${count} product_media row(s) with no variant_id — deleting...`);

    await sequelize.query("DELETE FROM product_media WHERE variant_id IS NULL");
    console.log("Deleted orphaned rows.");

    await sequelize.query(
      "ALTER TABLE product_media MODIFY COLUMN variant_id INT UNSIGNED NOT NULL"
    );
    console.log("Altered variant_id to NOT NULL.");

    await sequelize.close();
    console.log("Done.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
