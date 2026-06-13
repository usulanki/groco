import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`delivery_partners\` (
      \`id\`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
      \`name\`        VARCHAR(100)    NOT NULL,
      \`slug\`        VARCHAR(50)     NOT NULL,
      \`logo_url\`    VARCHAR(255)    NULL,
      \`description\` VARCHAR(255)    NULL,
      \`status\`      TINYINT(1)      NOT NULL DEFAULT 1,
      \`is_deleted\`  TINYINT(1)      NOT NULL DEFAULT 0,
      \`created_ts\`  DATETIME,
      \`updated_ts\`  DATETIME,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_delivery_partner_slug\` (\`slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("delivery_partners table created (or already exists).");
  await sequelize.close();
})().catch(err => { console.error(err.message); process.exit(1); });
