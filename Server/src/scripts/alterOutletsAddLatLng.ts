/**
 * Adds `latitude` and `longitude` columns to the `outlets` table.
 * Safe to re-run — skipped if the columns already exist.
 *
 * Run: npx tsx src/scripts/alterOutletsAddLatLng.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'outlets'
       AND COLUMN_NAME  IN ('latitude', 'longitude')`
  ) as any[];

  const existing = new Set((rows as any[]).map((r: any) => r.COLUMN_NAME));

  if (existing.has("latitude") && existing.has("longitude")) {
    console.log("SKIP: latitude and longitude already exist on outlets.");
  } else {
    const adds: string[] = [];
    if (!existing.has("latitude"))
      adds.push("ADD COLUMN `latitude`  DECIMAL(10,7) NULL DEFAULT NULL AFTER `location`");
    if (!existing.has("longitude"))
      adds.push("ADD COLUMN `longitude` DECIMAL(10,7) NULL DEFAULT NULL AFTER `latitude`");

    await sequelize.query(`ALTER TABLE \`outlets\` ${adds.join(", ")}`);
    console.log(`ADDED: ${adds.map(a => a.match(/`(\w+)`/)?.[1]).filter(Boolean).join(", ")} on outlets.`);
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
