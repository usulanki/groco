/**
 * Migration: extend the `discount_applicability.type` ENUM to include
 * 'sku', 'user', and 'customer_group'.
 * Safe to re-run — checks current ENUM definition first.
 *
 * Run with: npx ts-node src/seeders/alterDiscountApplicabilityAddTypes.ts
 */
import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  // Read current ENUM definition
  const [rows] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'discount_applicability'
       AND COLUMN_NAME  = 'type'`
  ) as [Array<{ COLUMN_TYPE: string }>, unknown];

  if (rows.length === 0) {
    console.error('Column "type" not found in discount_applicability table.');
    process.exit(1);
  }

  const current = rows[0]!.COLUMN_TYPE;
  console.log(`Current ENUM: ${current}`);

  const desired = "enum('product','category','sku','user','customer_group')";

  if (current === desired) {
    console.log("ENUM already up to date — nothing to do.");
  } else {
    await sequelize.query(
      `ALTER TABLE discount_applicability
       MODIFY COLUMN \`type\` ENUM('product','category','sku','user','customer_group') NOT NULL`
    );
    console.log("ENUM extended to: product, category, sku, user, customer_group");
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
