/**
 * Migration: add is_draft column to products table
 *
 * Run once:  npx tsx src/scripts/migrate-product-draft.ts
 * Then:      npx tsx src/scripts/sync.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected.");

    await sequelize.query(
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE"
    );
    console.log("Added is_draft column.");

    await sequelize.close();
    console.log("Done.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
