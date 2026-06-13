/**
 * Adds show_in_sidebar column to menus table.
 * Run: npx ts-node src/scripts/addShowInSidebarToMenus.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("Connected.");

  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menus' AND COLUMN_NAME = 'show_in_sidebar'`
  ) as [Array<unknown>, unknown];

  if ((rows as unknown[]).length > 0) {
    console.log("show_in_sidebar already exists — skipped.");
  } else {
    await sequelize.query(
      "ALTER TABLE menus ADD COLUMN show_in_sidebar TINYINT(1) NOT NULL DEFAULT 1"
    );
    console.log("show_in_sidebar added (default 1 = visible for all existing menus).");
  }

  await sequelize.close();
})().catch((err: any) => { console.error("Failed:", err.message); process.exit(1); });
