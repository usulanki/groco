/**
 * Adds `variant_id` column to `order_items` table so variant-level items
 * from the admin Create Order page are stored correctly.
 *
 * Safe to re-run — skipped if the column already exists.
 *
 * Run: npx tsx src/scripts/alterOrderItemsAddVariantId.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'variant_id'`
  ) as any[];

  if ((rows as any[]).length > 0) {
    console.log("SKIP: variant_id already exists on order_items.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`order_items\`
      ADD COLUMN \`variant_id\` INT UNSIGNED NULL DEFAULT NULL
        AFTER \`product_id\`,
      ADD CONSTRAINT \`order_items_variant_fk\`
        FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\` (\`id\`)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("ADD: variant_id on order_items");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
