/**
 * Adds return-tracking columns:
 *   returns.grn_id
 *   return_line_items.purchase_item_id
 *   grns.is_return_done
 *
 * Run: npx ts-node src/scripts/alterReturnTracking.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();

  await sequelize.query(`
    ALTER TABLE \`returns\`
      ADD COLUMN \`grn_id\` INT UNSIGNED NULL AFTER \`outlet_id\`,
      ADD CONSTRAINT \`returns_grn_fk\` FOREIGN KEY (\`grn_id\`) REFERENCES \`grns\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
  `);
  console.log("returns.grn_id added.");

  await sequelize.query(`
    ALTER TABLE \`return_line_items\`
      ADD COLUMN \`purchase_item_id\` INT UNSIGNED NULL AFTER \`return_id\`,
      ADD CONSTRAINT \`rli_purchase_item_fk\` FOREIGN KEY (\`purchase_item_id\`) REFERENCES \`purchase_items\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
  `);
  console.log("return_line_items.purchase_item_id added.");

  await sequelize.query(`
    ALTER TABLE \`grns\`
      ADD COLUMN \`is_return_done\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`is_partial\`;
  `);
  console.log("grns.is_return_done added.");

  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
