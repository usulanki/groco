import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`store_feature_flags\` (
      \`id\`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      \`store_id\`   INT UNSIGNED  NOT NULL,
      \`feature\`    VARCHAR(50)   NOT NULL,
      \`enabled\`    TINYINT(1)    NOT NULL DEFAULT 1,
      \`created_ts\` DATETIME,
      \`updated_ts\` DATETIME,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_store_feature\` (\`store_id\`, \`feature\`),
      CONSTRAINT \`sff_store_fk\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("store_feature_flags table created (or already exists).");
  await sequelize.close();
})().catch(err => { console.error(err.message); process.exit(1); });
