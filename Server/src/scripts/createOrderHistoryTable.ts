import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`order_history\` (
      \`id\`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      \`order_id\`     INT UNSIGNED  NOT NULL,
      \`action\`       VARCHAR(500)  NOT NULL,
      \`performed_by\` VARCHAR(150)  NULL,
      \`admin_id\`     INT UNSIGNED  NULL,
      \`created_ts\`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_order_history_order\` (\`order_id\`),
      CONSTRAINT \`fk_order_history_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_order_history_admin\` FOREIGN KEY (\`admin_id\`)  REFERENCES \`admins\`(\`id\`)  ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log("order_history table created (or already exists).");
  await sequelize.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
