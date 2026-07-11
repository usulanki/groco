/**
 * Adds `serviceable_distance_km` to the `outlets` table.
 * Safe to re-run — skipped if the column already exists.
 *
 * Run: npx tsx src/scripts/alterOutletsAddServiceableDistance.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'outlets'
       AND COLUMN_NAME  = 'serviceable_distance_km'`
  ) as any[];

  if ((rows as any[]).length > 0) {
    console.log("SKIP: serviceable_distance_km already exists on outlets.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`outlets\`
      ADD COLUMN \`serviceable_distance_km\` TINYINT UNSIGNED NOT NULL DEFAULT 5
        AFTER \`delivery_slots\`
    `);
    console.log("ADD: serviceable_distance_km on outlets (default 5 km).");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
