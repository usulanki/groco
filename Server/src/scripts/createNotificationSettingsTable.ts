/**
 * Migration: create notification_settings table and seed default rows for all existing admins.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/createNotificationSettingsTable.ts
 */

import sequelize from "../config/database";

const NOTIFICATION_KEYS = [
  "order_placed",
  "order_accepted",
  "order_shipped",
  "order_cancelled",
  "order_delivered",
  "admin_created",
  "admin_updated",
  "admin_deleted",
  "admin_status_changed",
  "role_created",
  "role_updated",
  "role_deleted",
  "role_status_changed",
  "review_added",
  "review_low_rating",
  "inventory_low_threshold",
  "inventory_zero",
  "inventory_transfer",
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");

    // 1. Create table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
        admin_id    INT UNSIGNED NOT NULL,
        \`key\`     VARCHAR(100) NOT NULL,
        enabled     TINYINT(1)   NOT NULL DEFAULT 1,
        created_ts  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_ts  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_admin_key (admin_id, \`key\`),
        CONSTRAINT fk_ns_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Table notification_settings: created (or already exists)");

    // 2. Fetch all non-deleted admins
    const [admins] = await sequelize.query(
      "SELECT id FROM admins WHERE is_deleted = 0"
    ) as [Array<{ id: number }>, unknown];

    console.log(`Seeding defaults for ${admins.length} admin(s)...`);

    let inserted = 0;
    let skipped  = 0;

    for (const admin of admins) {
      for (const key of NOTIFICATION_KEYS) {
        const [existing] = await sequelize.query(
          "SELECT id FROM notification_settings WHERE admin_id = ? AND `key` = ?",
          { replacements: [admin.id, key] }
        ) as [Array<{ id: number }>, unknown];

        if (existing.length === 0) {
          await sequelize.query(
            "INSERT INTO notification_settings (admin_id, `key`, enabled) VALUES (?, ?, 1)",
            { replacements: [admin.id, key] }
          );
          inserted++;
        } else {
          skipped++;
        }
      }
    }

    console.log(`Done — inserted: ${inserted}, already existed: ${skipped}`);
    await sequelize.close();
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
