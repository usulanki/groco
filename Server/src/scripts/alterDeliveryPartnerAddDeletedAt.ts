/**
 * Adds deleted_at column to delivery_partner table.
 * Run: npx tsx src/scripts/alterDeliveryPartnerAddDeletedAt.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    const [[col]] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='delivery_partner' AND TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='deleted_at'"
    ) as [Array<{ COLUMN_NAME: string }>, unknown];

    if (col) {
      console.log("Column 'deleted_at' already exists — skipping.");
    } else {
      await sequelize.query(
        "ALTER TABLE delivery_partner ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL AFTER updated_ts"
      );
      console.log("Added 'deleted_at' column.");
    }

    await sequelize.close();
  } catch (err: any) {
    console.error("Script failed:", err.message);
    process.exit(1);
  }
})();
