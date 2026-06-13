/**
 * Creates the `returns` table.
 *
 * Run: npx ts-node src/scripts/createReturnsTable.ts
 */

import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`returns\` (
      \`id\`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`type\`         ENUM('PURCHASE_RETURN','ORDER_RETURN') NOT NULL,
      \`ref_id\`       INT UNSIGNED NOT NULL COMMENT 'purchase_id or order_id depending on type',
      \`code\`         VARCHAR(20)  NOT NULL,
      \`payment_done\` TINYINT(1)   NOT NULL DEFAULT 0,
      \`cn_amount\`    DECIMAL(12,2) NOT NULL,
      \`vendor_id\`    INT UNSIGNED NULL,
      \`created_ts\`   DATETIME NULL,
      \`created_by\`   INT UNSIGNED NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`returns_code_uq\` (\`code\`),
      CONSTRAINT \`returns_vendor_fk\`     FOREIGN KEY (\`vendor_id\`)   REFERENCES \`vendors\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`returns_created_by_fk\` FOREIGN KEY (\`created_by\`)  REFERENCES \`admins\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("returns table created (or already exists).");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
