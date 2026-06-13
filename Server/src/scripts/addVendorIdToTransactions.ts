import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();

  // 1. Add vendor_id column if it doesn't exist
  const [cols] = await sequelize.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'vendor_id';
  `) as [any[], unknown];

  if (cols.length === 0) {
    await sequelize.query(`
      ALTER TABLE \`transactions\`
      ADD COLUMN \`vendor_id\` INT UNSIGNED NULL AFTER \`outlet_id\`;
    `);
    console.log("Column vendor_id added to transactions.");
  } else {
    console.log("Column vendor_id already exists, skipping ALTER.");
  }

  // 2. Backfill vendor_id for existing VENDOR-type transactions by matching vendor name
  const [updated] = await sequelize.query(`
    UPDATE \`transactions\` t
    JOIN \`vendors\` v ON v.company_name = t.name AND v.store_id = t.store_id
    SET t.vendor_id = v.id
    WHERE t.type = 'VENDOR' AND t.vendor_id IS NULL;
  `) as [any, unknown];
  console.log("Backfilled vendor_id for existing transactions.");

  await sequelize.close();
  console.log("Done.");
})().catch(err => { console.error(err.message); process.exit(1); });
