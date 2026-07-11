/**
 * Adds store_id and outlet_id columns to delivery_partner table.
 * Run: npx tsx src/scripts/alterDeliveryPartnerAddStoreOutlet.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    const [[cols]] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='delivery_partner' AND TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='store_id'"
    ) as [Array<{ COLUMN_NAME: string }>, unknown];

    if (cols) {
      console.log("Columns already exist — skipping.");
    } else {
      await sequelize.query(`
        ALTER TABLE delivery_partner
          ADD COLUMN store_id  INT UNSIGNED NULL AFTER contact_person_number,
          ADD COLUMN outlet_id INT UNSIGNED NULL AFTER store_id;
      `);
      console.log("Added store_id and outlet_id columns.");
    }

    await sequelize.close();
  } catch (err: any) {
    console.error("Script failed:", err.message);
    process.exit(1);
  }
})();
