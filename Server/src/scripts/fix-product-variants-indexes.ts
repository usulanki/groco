/**
 * One-time script to drop duplicate/excess indexes on product_variants
 * that accumulated from repeated sequelize.sync({ alter: true }) runs.
 * Run once: npx ts-node src/scripts/fix-product-variants-indexes.ts
 */
import sequelize from "../config/database";

async function run() {
  const q = sequelize.getQueryInterface();

  // Fetch all current indexes on the table
  const indexes = await q.showIndex("product_variants") as Array<{ name: string; Key_name?: string }>;
  const indexNames: string[] = indexes
    .map((i) => i.Key_name ?? i.name)
    .filter((name) => name && name !== "PRIMARY");

  const keepNames = new Set(["uq_product_variants_sku", "uq_product_variants_barcode"]);
  const toDrop = indexNames.filter((name) => !keepNames.has(name));

  if (toDrop.length === 0) {
    console.log("No excess indexes to drop.");
  } else {
    console.log(`Dropping ${toDrop.length} excess indexes: ${toDrop.join(", ")}`);
    for (const name of toDrop) {
      await sequelize.query(`ALTER TABLE \`product_variants\` DROP INDEX \`${name}\``);
      console.log(`  Dropped: ${name}`);
    }
  }

  // Ensure the canonical named indexes exist
  const remaining = await q.showIndex("product_variants") as Array<{ name: string; Key_name?: string }>;
  const remainingNames = new Set(remaining.map((i) => i.Key_name ?? i.name));

  if (!remainingNames.has("uq_product_variants_sku")) {
    await sequelize.query(
      "ALTER TABLE `product_variants` ADD UNIQUE INDEX `uq_product_variants_sku` (`sku`)"
    );
    console.log("Created index: uq_product_variants_sku");
  }
  if (!remainingNames.has("uq_product_variants_barcode")) {
    await sequelize.query(
      "ALTER TABLE `product_variants` ADD UNIQUE INDEX `uq_product_variants_barcode` (`barcode`)"
    );
    console.log("Created index: uq_product_variants_barcode");
  }

  console.log("Done.");
  await sequelize.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
