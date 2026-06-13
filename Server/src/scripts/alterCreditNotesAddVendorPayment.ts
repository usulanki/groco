/**
 * Adds vendor_id and payment_id columns to the `credit_notes` table.
 *
 * Run: npx ts-node src/scripts/alterCreditNotesAddVendorPayment.ts
 */

import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();

  await sequelize.query(`
    ALTER TABLE \`credit_notes\`
      ADD COLUMN \`vendor_id\`  INT UNSIGNED NULL AFTER \`outlet_id\`,
      ADD COLUMN \`payment_id\` INT UNSIGNED NULL AFTER \`purchase_code\`,
      ADD CONSTRAINT \`cn_vendor_fk\`  FOREIGN KEY (\`vendor_id\`)  REFERENCES \`vendors\`      (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
      ADD CONSTRAINT \`cn_payment_fk\` FOREIGN KEY (\`payment_id\`) REFERENCES \`transactions\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
  `);

  console.log("credit_notes: vendor_id and payment_id columns added.");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
