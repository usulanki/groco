/**
 * Adds `latitude` and `longitude` columns to the `orders` table
 * to stamp the customer's location at the time of order placement.
 *
 * Safe to re-run — skipped if columns already exist.
 *
 * Run: npx tsx src/scripts/alterOrdersAddLatLng.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [cols] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
     AND COLUMN_NAME IN ('latitude', 'longitude')`
  ) as any[];

  const existing = new Set((cols as any[]).map((r: any) => r.COLUMN_NAME));

  if (existing.has("latitude") && existing.has("longitude")) {
    console.log("SKIP: latitude and longitude already exist on orders.");
  } else {
    const adds: string[] = [];
    if (!existing.has("latitude"))
      adds.push("ADD COLUMN `latitude`  DECIMAL(10,7) NULL DEFAULT NULL AFTER `notes`");
    if (!existing.has("longitude"))
      adds.push("ADD COLUMN `longitude` DECIMAL(10,7) NULL DEFAULT NULL AFTER `latitude`");

    await sequelize.query(`ALTER TABLE \`orders\` ${adds.join(", ")}`);
    console.log(`ADD: ${adds.map(a => a.split("`")[1]).join(", ")} on orders`);
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
