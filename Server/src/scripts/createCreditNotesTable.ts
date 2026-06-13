/**
 * Creates the `credit_notes` table.
 *
 * Run: npx ts-node src/scripts/createCreditNotesTable.ts
 */

import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`credit_notes\` (
      \`id\`            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      \`cn_code\`       VARCHAR(25)   NOT NULL,
      \`return_id\`     INT UNSIGNED  NOT NULL,
      \`store_id\`      INT UNSIGNED  NOT NULL,
      \`outlet_id\`     INT UNSIGNED  NULL,
      \`grn_code\`      VARCHAR(25)   NOT NULL,
      \`purchase_code\` VARCHAR(25)   NOT NULL,
      \`created_by\`    INT UNSIGNED  NULL,
      \`created_ts\`    DATETIME      NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`credit_notes_cn_code_uq\` (\`cn_code\`),
      CONSTRAINT \`cn_return_fk\`     FOREIGN KEY (\`return_id\`)  REFERENCES \`returns\`  (\`id\`) ON DELETE CASCADE  ON UPDATE CASCADE,
      CONSTRAINT \`cn_store_fk\`      FOREIGN KEY (\`store_id\`)   REFERENCES \`stores\`   (\`id\`) ON DELETE CASCADE  ON UPDATE CASCADE,
      CONSTRAINT \`cn_outlet_fk\`     FOREIGN KEY (\`outlet_id\`)  REFERENCES \`outlets\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`cn_created_by_fk\` FOREIGN KEY (\`created_by\`) REFERENCES \`admins\`   (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("credit_notes table created (or already exists).");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
