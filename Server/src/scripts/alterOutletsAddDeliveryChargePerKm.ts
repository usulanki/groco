/**
 * Adds `delivery_charge_per_km` to the `outlets` table.
 * Safe to re-run — skipped if the column already exists.
 *
 * Run: npx tsx src/scripts/alterOutletsAddDeliveryChargePerKm.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'outlets'
       AND COLUMN_NAME  = 'delivery_charge_per_km'`
  ) as any[];

  if ((rows as any[]).length > 0) {
    console.log("SKIP: delivery_charge_per_km already exists on outlets.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`outlets\`
      ADD COLUMN \`delivery_charge_per_km\` DECIMAL(8,2) NOT NULL DEFAULT 10.00
        AFTER \`serviceable_distance_km\`
    `);
    console.log("ADD: delivery_charge_per_km on outlets (default 10.00).");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
