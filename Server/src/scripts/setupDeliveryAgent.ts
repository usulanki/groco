/**
 * One-time setup: adds missing columns to delivery_partner table
 * and sets the password for tom@marshall.com.
 * Run: npx tsx src/scripts/setupDeliveryAgent.ts
 */

import bcrypt from "bcryptjs";
import sequelize from "../config/database";

async function addColumnIfMissing(columnName: string, alterSql: string) {
  const [[col]] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME='delivery_partner' AND TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='${columnName}'`
  ) as [Array<{ COLUMN_NAME: string }>, unknown];

  if (col) {
    console.log(`  '${columnName}' already exists — skipping.`);
  } else {
    await sequelize.query(alterSql);
    console.log(`  Added '${columnName}'.`);
  }
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.\n");

    console.log("1. Adding missing columns...");
    await addColumnIfMissing("password",   "ALTER TABLE delivery_partner ADD COLUMN password VARCHAR(255) NULL DEFAULT NULL AFTER mobile");
    await addColumnIfMissing("store_id",   "ALTER TABLE delivery_partner ADD COLUMN store_id INT UNSIGNED NULL AFTER contact_person_number, ADD COLUMN outlet_id INT UNSIGNED NULL AFTER store_id");
    await addColumnIfMissing("deleted_at", "ALTER TABLE delivery_partner ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL AFTER updated_ts");

    console.log("\n2. Setting password for tom@marshall.com...");
    const hash = await bcrypt.hash("Password@123", 10);
    const [, meta] = await sequelize.query(
      `UPDATE delivery_partner SET password = '${hash}' WHERE email = 'tom@marshall.com' AND is_deleted = 0`,
    ) as [unknown, any];

    const affected = meta?.affectedRows ?? 0;
    if (affected === 0) {
      console.log("  No record found for tom@marshall.com — creating one...");
      await sequelize.query(`
        INSERT INTO delivery_partner (first_name, last_name, email, mobile, password, status, is_deleted)
        VALUES ('Tom', 'Marshall', 'tom@marshall.com', '0000000000', '${hash}', 1, 0)
      `);
      console.log("  Created delivery agent: tom@marshall.com");
    } else {
      console.log(`  Password updated for tom@marshall.com (${affected} row affected).`);
    }

    console.log("\nDone. You can now log in with tom@marshall.com / Password@123");
    await sequelize.close();
  } catch (err: any) {
    console.error("Script failed:", err.message);
    process.exit(1);
  }
})();
