import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`vendors\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`store_id\` INT UNSIGNED NULL,
      \`company_name\` VARCHAR(255) NOT NULL,
      \`owner_name\` VARCHAR(255) NOT NULL,
      \`owner_email\` VARCHAR(255) NULL,
      \`owner_phone\` VARCHAR(255) NOT NULL,
      \`owner_address\` VARCHAR(500) NULL,
      \`gst_no\` VARCHAR(255) NULL,
      \`status\` TINYINT(1) NOT NULL DEFAULT 1,
      \`is_deleted\` TINYINT(1) NOT NULL DEFAULT 0,
      \`created_ts\` DATETIME,
      \`updated_ts\` DATETIME,
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`vendors_store_fk\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("vendors table created (or already exists).");
  await sequelize.close();
})().catch(err => { console.error(err.message); process.exit(1); });
