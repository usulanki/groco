/**
 * Adds 'order_placed' to the orders.order_status ENUM so website orders
 * can land in a distinct state awaiting admin acceptance.
 *
 * Safe to re-run — checks current ENUM before altering.
 *
 * Run: npx tsx src/scripts/alterOrdersAddOrderPlacedStatus.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [[row]] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_status'`
  ) as any[];

  const current: string = row?.COLUMN_TYPE ?? '';
  if (current.includes("'order_placed'")) {
    console.log("SKIP: 'order_placed' already in ENUM.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`orders\`
      MODIFY COLUMN \`order_status\`
        ENUM('order_placed','pending','confirmed','shipped','delivered','cancelled')
        NOT NULL DEFAULT 'pending'
    `);
    console.log("ADD: 'order_placed' to orders.order_status ENUM");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
