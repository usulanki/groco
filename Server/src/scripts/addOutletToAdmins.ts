/**
 * Adds outlet_id to the admins table.
 * Run: npx ts-node src/scripts/addOutletToAdmins.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    ALTER TABLE \`admins\`
    ADD COLUMN \`outlet_id\` INT UNSIGNED NULL AFTER \`store_id\`,
    ADD CONSTRAINT \`admins_outlet_fk\` FOREIGN KEY (\`outlet_id\`) REFERENCES \`outlets\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("outlet_id added to admins.");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
