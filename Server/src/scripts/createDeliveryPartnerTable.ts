/**
 * Creates the delivery_partner table.
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/createDeliveryPartnerTable.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS delivery_partner (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name  VARCHAR(100) NOT NULL,
        email      VARCHAR(255) NULL,
        mobile     VARCHAR(20)  NOT NULL,
        address1   VARCHAR(255) NULL,
        address2   VARCHAR(255) NULL,
        city       VARCHAR(100) NULL,
        state      VARCHAR(100) NULL,
        pincode    VARCHAR(10)  NULL,
        document_type ENUM('aadhar','pan','driving_licence','passport','voter_id') NULL,
        document_no            VARCHAR(50)  NULL,
        contact_person         VARCHAR(100) NULL,
        contact_person_number  VARCHAR(20)  NULL,
        status     TINYINT(1) NOT NULL DEFAULT 1,
        is_deleted TINYINT(1) NOT NULL DEFAULT 0,
        created_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Table 'delivery_partner' created (or already exists).");
    await sequelize.close();
  } catch (err: any) {
    console.error("Script failed:", err.message);
    process.exit(1);
  }
})();
