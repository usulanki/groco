/**
 * Adds `delivery_charge` to the `orders` table.
 * Safe to re-run — skipped if the column already exists.
 *
 * Run: npx tsx src/scripts/alterOrdersAddDeliveryCharge.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'orders'
       AND COLUMN_NAME  = 'delivery_charge'`
  ) as any[];

  if ((rows as any[]).length > 0) {
    console.log("SKIP: delivery_charge already exists on orders.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`delivery_charge\` DECIMAL(10,2) NOT NULL DEFAULT 0.00
        AFTER \`discount_amount\`
    `);
    console.log("ADD: delivery_charge on orders (default 0.00).");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
