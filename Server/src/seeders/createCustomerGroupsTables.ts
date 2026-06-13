/**
 * Migration: create `customer_groups` and `customer_group_members` tables.
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS.
 *
 * Run with: npx ts-node src/seeders/createCustomerGroupsTables.ts
 */
import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS customer_groups (
      id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100)  NOT NULL,
      description VARCHAR(255)  NULL,
      store_id    INT UNSIGNED  NOT NULL,
      status      TINYINT(1)    NOT NULL DEFAULT 1,
      is_deleted  TINYINT(1)    NOT NULL DEFAULT 0,
      created_ts  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_ts  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_cg_store FOREIGN KEY (store_id) REFERENCES stores(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('Table "customer_groups": ready.');

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS customer_group_members (
      id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      customer_group_id INT UNSIGNED NOT NULL,
      user_id           INT UNSIGNED NOT NULL,
      UNIQUE KEY uq_group_user (customer_group_id, user_id),
      CONSTRAINT fk_cgm_group FOREIGN KEY (customer_group_id) REFERENCES customer_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_cgm_user  FOREIGN KEY (user_id)           REFERENCES users(id)           ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('Table "customer_group_members": ready.');

  console.log("\nDone.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
