/**
 * One-shot script: grants full Dashboard permissions to the MANAGER role
 * for all stores.
 * Safe to re-run — uses findOrCreate / update throughout.
 *
 * Run with: npx tsx src/seeders/addManagerDashboardPermission.ts
 */
import sequelize from "../config/database";
import "../models/index";
import Role from "../models/role.model";
import Menu from "../models/menu.model";
import Permission from "../models/permission.model";
import Store from "../models/store.model";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  // 1. Find MANAGER role
  const managerRole = await Role.findOne({ where: { code: "MANAGER" } });
  if (!managerRole) {
    console.error("MANAGER role not found. Run the main seed first.");
    process.exit(1);
  }
  console.log(`MANAGER role found (id=${managerRole.id})`);

  // 2. Find Dashboard menu
  const dashboardMenu = await Menu.findOne({ where: { name: "Dashboard", parent_id: null } });
  if (!dashboardMenu) {
    console.error("Dashboard menu not found. Run the main seed first.");
    process.exit(1);
  }
  console.log(`Dashboard menu found (id=${dashboardMenu.id})`);

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };

  // 3. Grant full Dashboard permissions to MANAGER for every store
  const stores = await Store.findAll({ where: { is_deleted: false } });
  for (const store of stores) {
    const [, created] = await Permission.findOrCreate({
      where: { menu_id: dashboardMenu.id, role_id: managerRole.id, store_id: store.id },
      defaults: { menu_id: dashboardMenu.id, role_id: managerRole.id, store_id: store.id, ...fullPerms },
    });
    if (!created) {
      await Permission.update(fullPerms, {
        where: { menu_id: dashboardMenu.id, role_id: managerRole.id, store_id: store.id },
      });
    }
    console.log(`Permission MANAGER / Dashboard / store ${store.id}: ${created ? "created" : "updated"}`);
  }

  console.log("\nDone. Manager accounts now have full Dashboard permission.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
