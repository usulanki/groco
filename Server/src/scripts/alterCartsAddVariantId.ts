/**
 * Adds `variant_id` column to `carts` table so the selected variant
 * is stored when a customer adds a product with a size/weight option.
 *
 * Safe to re-run — skipped if the column already exists.
 *
 * Run: npx tsx src/scripts/alterCartsAddVariantId.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts' AND COLUMN_NAME = 'variant_id'`
  ) as any[];

  if ((rows as any[]).length > 0) {
    console.log("SKIP: variant_id already exists on carts.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`carts\`
      ADD COLUMN \`variant_id\` INT UNSIGNED NULL DEFAULT NULL
        AFTER \`product_id\`,
      ADD CONSTRAINT \`carts_variant_fk\`
        FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\` (\`id\`)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("ADD: variant_id on carts");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
