import sequelize from "../config/database";
import "../models/index";

const TABLES_IN_ORDER = [
  // Product dependents (deepest children first)
  "cart_items",
  "carts",
  "wishlists",
  "order_items",
  "product_media",
  "product_outlets",
  "product_prices",
  "product_variants",
  "reviews",
  "inventory",
  // Category dependents
  "materials",
  // Core tables
  "products",
  "categories",
  // Product images in media
  "media",
];

async function clearProductsAndCategories() {
  await sequelize.authenticate();

  await sequelize.query("SET FOREIGN_KEY_CHECKS=0");

  for (const table of TABLES_IN_ORDER) {
    try {
      const [[row]] = await sequelize.query(`SELECT COUNT(*) as n FROM \`${table}\``) as any;
      await sequelize.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`  ✓ Cleared  ${table.padEnd(22)} (${row.n} rows removed)`);
    } catch {
      console.log(`  – Skipped  ${table.padEnd(22)} (table not found)`);
    }
  }

  await sequelize.query("SET FOREIGN_KEY_CHECKS=1");

  console.log("\nDone — all product and category data cleared.");
  await sequelize.close();
}

clearProductsAndCategories().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
