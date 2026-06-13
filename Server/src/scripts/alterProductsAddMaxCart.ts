/**
 * Migration: Add max_cart column to products table.
 * max_cart: nullable unsigned int — maximum quantity a customer can add to cart.
 * NULL means no limit.
 *
 * Run: npx tsx src/scripts/alterProductsAddMaxCart.ts
 */
import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [cols] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'max_cart'`
  ) as [Array<object>, unknown];

  if (cols.length > 0) {
    console.log("Column max_cart already exists, skipping.");
  } else {
    await sequelize.query(`
      ALTER TABLE products
      ADD COLUMN max_cart INT UNSIGNED NULL DEFAULT NULL
        COMMENT 'Max quantity per cart order. NULL = no limit.'
    `);
  }

  console.log("Done: max_cart column added to products.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
