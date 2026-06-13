/**
 * Migration: Make products.store_id nullable so products can be global (store_id = NULL).
 * Safe to re-run — skips if column is already nullable.
 *
 * Run: npx tsx src/seeders/alterProductsGlobal.ts
 */
import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [cols] = await sequelize.query(
    `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'store_id'`
  ) as [Array<{ IS_NULLABLE: string }>, unknown];

  if (cols[0]?.IS_NULLABLE === "YES") {
    console.log("products.store_id is already nullable. Skipping.");
  } else {
    await sequelize.query(
      "ALTER TABLE products MODIFY COLUMN store_id INT UNSIGNED NULL DEFAULT NULL"
    );
    console.log("products.store_id is now nullable (global products supported).");
  }

  console.log("Done.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
