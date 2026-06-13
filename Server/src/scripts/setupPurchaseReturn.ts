/**
 * Sets up purchase return schema:
 *  - ALTER returns: drop ref_id, add outlet_id
 *  - ALTER purchases: add outlet_id
 *  - ALTER grns: add outlet_id
 *  - CREATE return_line_items
 *
 * Run: npx ts-node src/scripts/setupPurchaseReturn.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();

  // 1. returns: drop ref_id, add outlet_id
  await sequelize.query("ALTER TABLE `returns` DROP COLUMN `ref_id`");
  await sequelize.query(`
    ALTER TABLE \`returns\`
    ADD COLUMN \`outlet_id\` INT UNSIGNED NULL AFTER \`store_id\`,
    ADD CONSTRAINT \`returns_outlet_fk\` FOREIGN KEY (\`outlet_id\`) REFERENCES \`outlets\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("returns: ref_id dropped, outlet_id added");

  // 2. purchases: add outlet_id
  await sequelize.query(`
    ALTER TABLE \`purchases\`
    ADD COLUMN \`outlet_id\` INT UNSIGNED NULL AFTER \`store_id\`,
    ADD CONSTRAINT \`purchases_outlet_fk\` FOREIGN KEY (\`outlet_id\`) REFERENCES \`outlets\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("purchases: outlet_id added");

  // 3. grns: add outlet_id
  await sequelize.query(`
    ALTER TABLE \`grns\`
    ADD COLUMN \`outlet_id\` INT UNSIGNED NULL AFTER \`purchase_id\`,
    ADD CONSTRAINT \`grns_outlet_fk\` FOREIGN KEY (\`outlet_id\`) REFERENCES \`outlets\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("grns: outlet_id added");

  // 4. create return_line_items
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`return_line_items\` (
      \`id\`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`return_id\`  INT UNSIGNED NOT NULL,
      \`store_id\`   INT UNSIGNED NOT NULL,
      \`vendor_id\`  INT UNSIGNED NULL,
      \`outlet_id\`  INT UNSIGNED NULL,
      \`type\`       ENUM('P','M') NOT NULL COMMENT 'P = product, M = material',
      \`ref_id\`     INT UNSIGNED NOT NULL COMMENT 'product_id (P) or material_id (M)',
      \`qty\`        DECIMAL(10,2) NOT NULL,
      \`item_price\` DECIMAL(12,2) NOT NULL,
      \`amount\`     DECIMAL(12,2) NOT NULL,
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`rli_return_fk\`  FOREIGN KEY (\`return_id\`)  REFERENCES \`returns\`  (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`rli_store_fk\`   FOREIGN KEY (\`store_id\`)   REFERENCES \`stores\`   (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT \`rli_vendor_fk\`  FOREIGN KEY (\`vendor_id\`)  REFERENCES \`vendors\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT \`rli_outlet_fk\`  FOREIGN KEY (\`outlet_id\`)  REFERENCES \`outlets\`  (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("return_line_items table created");

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
