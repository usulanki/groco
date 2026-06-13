/**
 * Creates the `materials` table.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/createMaterialsTable.ts
 */

import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`materials\` (
      \`id\`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`store_id\`    INT UNSIGNED NULL,
      \`code\`        VARCHAR(100) NOT NULL,
      \`name\`        VARCHAR(255) NOT NULL,
      \`value\`       DECIMAL(15,4) NOT NULL DEFAULT 0,
      \`uom_id\`      INT UNSIGNED NULL,
      \`status\`      TINYINT(1) NOT NULL DEFAULT 1,
      \`is_deleted\`  TINYINT(1) NOT NULL DEFAULT 0,
      \`created_by\`  INT UNSIGNED NULL,
      \`created_ts\`  DATETIME NULL,
      \`updated_by\`  INT UNSIGNED NULL,
      \`updated_ts\`  DATETIME NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`materials_store_code_uq\` (\`store_id\`, \`code\`),
      CONSTRAINT \`materials_store_fk\`   FOREIGN KEY (\`store_id\`)   REFERENCES \`stores\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`materials_uom_fk\`     FOREIGN KEY (\`uom_id\`)     REFERENCES \`uoms\`    (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`materials_created_fk\` FOREIGN KEY (\`created_by\`) REFERENCES \`admins\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`materials_updated_fk\` FOREIGN KEY (\`updated_by\`) REFERENCES \`admins\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("materials table created (or already exists).");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
