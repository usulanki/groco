/**
 * Creates the `payments` table.
 * Code format: TXN + YYYYMMDD + 6-digit sequence  e.g. TXN202604050000001
 *
 * Run: npx ts-node src/scripts/createPaymentsTable.ts
 */

import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`payments\` (
      \`id\`           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
      \`store_id\`     INT UNSIGNED   NOT NULL,
      \`outlet_id\`    INT UNSIGNED   NULL,
      \`type\`         ENUM('VENDOR','CUSTOMER') NOT NULL,
      \`code\`         VARCHAR(25)    NOT NULL,
      \`name\`         VARCHAR(255)   NOT NULL,
      \`phone\`        VARCHAR(20)    NULL,
      \`email\`        VARCHAR(255)   NULL,
      \`channel\`      ENUM('CRM','WEB','ANDROID_APP','IOS_APP') NOT NULL DEFAULT 'CRM',
      \`payment_mode\` VARCHAR(50)    NOT NULL,
      \`ref_no\`       VARCHAR(100)   NULL,
      \`amount\`       DECIMAL(12,2)  NOT NULL,
      \`payment_date\` DATE           NOT NULL,
      \`created_ts\`   DATETIME       NULL DEFAULT CURRENT_TIMESTAMP,
      \`created_by\`   INT UNSIGNED   NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`payments_code_uq\` (\`code\`),
      CONSTRAINT \`payments_store_fk\`      FOREIGN KEY (\`store_id\`)   REFERENCES \`stores\`  (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT \`payments_outlet_fk\`     FOREIGN KEY (\`outlet_id\`)  REFERENCES \`outlets\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`payments_created_by_fk\` FOREIGN KEY (\`created_by\`) REFERENCES \`admins\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("payments table created (or already exists).");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
