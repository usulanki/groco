import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();

  const [rows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'delivery_agent_payouts'
  `);
  if ((rows as any[])[0].cnt > 0) {
    console.log("Table delivery_agent_payouts already exists — skipping.");
    await sequelize.close();
    return;
  }

  await sequelize.query(`
    CREATE TABLE delivery_agent_payouts (
      id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      delivery_agent_id INT UNSIGNED    NOT NULL,
      amount            DECIMAL(10,2)   NOT NULL,
      status            ENUM('pending','completed','rejected') NOT NULL DEFAULT 'pending',
      notes             TEXT            NULL,
      created_ts        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_ts        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agent (delivery_agent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log("Created table delivery_agent_payouts.");
  await sequelize.close();
}

run().catch(err => { console.error(err); process.exit(1); });
