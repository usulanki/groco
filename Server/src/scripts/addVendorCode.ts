import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();

  // 1. Add vendor_code column only if it doesn't exist
  const [cols] = await sequelize.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'vendor_code';
  `) as [any[], unknown];

  if (cols.length === 0) {
    await sequelize.query(`
      ALTER TABLE \`vendors\`
      ADD COLUMN \`vendor_code\` VARCHAR(20) NULL AFTER \`store_id\`;
    `);
    console.log("Column vendor_code added.");
  } else {
    console.log("Column vendor_code already exists, skipping.");
  }

  // 2. Populate existing vendors with generated codes
  await sequelize.query(`
    UPDATE \`vendors\`
    SET \`vendor_code\` = CONCAT('VND-', LPAD(id, 4, '0'))
    WHERE \`vendor_code\` IS NULL;
  `);
  console.log("Existing vendors populated with vendor_code.");

  // 3. Make the column NOT NULL and UNIQUE
  await sequelize.query(`
    ALTER TABLE \`vendors\`
    MODIFY COLUMN \`vendor_code\` VARCHAR(20) NOT NULL;
  `);

  const [idxRows] = await sequelize.query(`
    SELECT INDEX_NAME FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors' AND INDEX_NAME = 'vendors_vendor_code_unique';
  `) as [any[], unknown];

  if (idxRows.length === 0) {
    await sequelize.query(`
      ALTER TABLE \`vendors\` ADD UNIQUE INDEX \`vendors_vendor_code_unique\` (\`vendor_code\`);
    `);
  }
  console.log("vendor_code set to NOT NULL UNIQUE.");

  // 4. Create a trigger to auto-generate vendor_code on insert
  await sequelize.query(`DROP TRIGGER IF EXISTS \`trg_vendor_code_before_insert\`;`);
  await sequelize.query(`
    CREATE TRIGGER \`trg_vendor_code_before_insert\`
    BEFORE INSERT ON \`vendors\`
    FOR EACH ROW
    BEGIN
      DECLARE next_id INT;
      SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors');
      SET NEW.vendor_code = CONCAT('VND-', LPAD(next_id, 4, '0'));
    END;
  `);
  console.log("Trigger trg_vendor_code_before_insert created.");

  await sequelize.close();
  console.log("Done.");
})().catch(err => { console.error(err.message); process.exit(1); });
