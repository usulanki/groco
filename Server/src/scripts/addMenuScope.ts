/**
 * Migration: set scope column on existing menu rows.
 *
 * Rules:
 *  - Menus whose name matches "Permissions" or "Roles" → scope = NULL  (MANAGER-only menus are excluded)
 *  - All other top-level menus → scope = "SUPERADMIN,ADMIN"
 *
 * Run:  npx ts-node -r tsconfig-paths/register src/scripts/addMenuScope.ts
 */

import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("Connected to DB");

  // Set NULL for menus that should NOT be visible to SUPERADMIN/ADMIN via scope
  // (i.e. Permissions and Roles menus — scope is managed separately or hidden)
  const [, nullResult] = await sequelize.query(
    `UPDATE menus SET scope = NULL WHERE name IN ('Permissions', 'Roles')`
  );
  console.log(`Cleared scope for Permissions/Roles menus:`, nullResult);

  // Set SUPERADMIN,ADMIN for all other menus that haven't been set yet or need updating
  const [, defaultResult] = await sequelize.query(
    `UPDATE menus SET scope = 'SUPERADMIN,ADMIN' WHERE name NOT IN ('Permissions', 'Roles')`
  );
  console.log(`Set scope='SUPERADMIN,ADMIN' for remaining menus:`, defaultResult);

  console.log("Done.");
  await sequelize.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
