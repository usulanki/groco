/**
 * Migration: create setting_menus table and seed default items including Invoice.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/createSettingMenusTable.ts
 */

import sequelize from "../config/database";

const DEFAULT_MENUS = [
  { name: "Configs",       slug: "configs",       description: "Store defaults and system config",     icon: "sliders",       route: "/settings/configs",       sort_order: 10 },
  { name: "Notifications", slug: "notifications", description: "Notification preferences",             icon: "bell",          route: "/settings/notifications", sort_order: 20 },
  { name: "Templates",     slug: "templates",     description: "Email and SMS templates",              icon: "file-text",     route: "/settings/templates",     sort_order: 30 },
  { name: "Jobs",          slug: "jobs",          description: "Background jobs and scheduled tasks",  icon: "clock",         route: "/settings/jobs",          sort_order: 40 },
  { name: "Invoice",       slug: "invoice",       description: "Invoice appearance and numbering",     icon: "receipt",       route: "/settings/invoice",       sort_order: 45 },
  { name: "Trash",         slug: "trash",         description: "Recover recently deleted records",     icon: "trash-2",       route: "/settings/trash",         sort_order: 50 },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // 1. Create table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS setting_menus (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name        VARCHAR(100) NOT NULL,
        slug        VARCHAR(100) NOT NULL,
        description VARCHAR(255) DEFAULT NULL,
        icon        VARCHAR(100) DEFAULT NULL,
        route       VARCHAR(255) NOT NULL,
        sort_order  INT          NOT NULL DEFAULT 0,
        parent_id   INT UNSIGNED DEFAULT NULL,
        is_active   TINYINT(1)   NOT NULL DEFAULT 1,
        created_ts  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_ts  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Table setting_menus: created (or already exists).");

    // 2. Upsert each menu item
    let inserted = 0;
    let updated  = 0;

    for (const item of DEFAULT_MENUS) {
      const [existing] = await sequelize.query(
        "SELECT id FROM setting_menus WHERE slug = ?",
        { replacements: [item.slug] }
      ) as [Array<{ id: number }>, unknown];

      if (existing.length > 0) {
        await sequelize.query(
          `UPDATE setting_menus
             SET name = ?, description = ?, icon = ?, route = ?, sort_order = ?, is_active = 1
           WHERE slug = ?`,
          { replacements: [item.name, item.description, item.icon, item.route, item.sort_order, item.slug] }
        );
        console.log(`  "${item.name}": updated`);
        updated++;
      } else {
        await sequelize.query(
          `INSERT INTO setting_menus (name, slug, description, icon, route, sort_order, parent_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, NULL, 1)`,
          { replacements: [item.name, item.slug, item.description, item.icon, item.route, item.sort_order] }
        );
        console.log(`  "${item.name}": inserted`);
        inserted++;
      }
    }

    console.log(`\nDone — inserted: ${inserted}, updated: ${updated}`);
    await sequelize.close();
  } catch (err: any) {
    console.error("Script failed:", err.message);
    process.exit(1);
  }
})();
