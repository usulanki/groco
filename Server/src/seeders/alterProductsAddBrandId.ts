/**
 * Migration: Add `brand_id` (nullable FK to brands) to the products table.
 * Safe to re-run — skips if column already exists.
 *
 * Run: npx tsx src/seeders/alterProductsAddBrandId.ts
 */
import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  // Check if column already exists
  const [cols] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'brand_id'`
  ) as [Array<{ COLUMN_NAME: string }>, unknown];

  if (cols.length > 0) {
    console.log("Column 'brand_id' already exists on products table. Skipping.");
  } else {
    await sequelize.query(
      "ALTER TABLE products ADD COLUMN brand_id INT UNSIGNED NULL DEFAULT NULL AFTER tax_id"
    );
    await sequelize.query(
      "ALTER TABLE products ADD CONSTRAINT fk_products_brand_id FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
    console.log("Column 'brand_id' added to products table with FK to brands.");
  }

  console.log("Done.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
