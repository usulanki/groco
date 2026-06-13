/**
 * One-shot script: inserts the "Variant Master" submenu under Masters
 * and grants full permissions to SUPERADMIN + ADMIN roles.
 * Safe to re-run — uses findOrCreate / upsert throughout.
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

  // 1. Find the Masters parent menu
  const mastersMenu = await Menu.findOne({ where: { name: "Masters", parent_id: null } });
  if (!mastersMenu) {
    console.error('Could not find "Masters" parent menu. Make sure the seed has been run at least once.');
    process.exit(1);
  }

  // 2. Find or create Variant Master submenu
  const [variantMenu, created] = await Menu.findOrCreate({
    where: { name: "Variant Master", parent_id: mastersMenu.id },
    defaults: {
      name: "Variant Master",
      link: "/variants",
      sort_order: 4.5,
      icon: "variant-master",
      parent_id: mastersMenu.id,
      status: true,
    },
  });
  console.log(`Menu "Variant Master": ${created ? "created" : "already exists"} (id=${variantMenu.id})`);

  // 3. Roles
  const superadminRole = await Role.findOne({ where: { code: "SUPERADMIN" } });
  const adminRole      = await Role.findOne({ where: { code: "ADMIN" } });
  if (!superadminRole || !adminRole) {
    console.error("Roles not found. Run the main seed first.");
    process.exit(1);
  }

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };

  // 4. SUPERADMIN — global (store_id null)
  const [, saCreated] = await Permission.findOrCreate({
    where: { menu_id: variantMenu.id, role_id: superadminRole.id, store_id: null },
    defaults: { menu_id: variantMenu.id, role_id: superadminRole.id, store_id: null, ...fullPerms },
  });
  if (!saCreated) {
    await Permission.update(fullPerms, {
      where: { menu_id: variantMenu.id, role_id: superadminRole.id, store_id: null },
    });
  }
  console.log(`Permission SUPERADMIN / Variant Master / global: ${saCreated ? "created" : "updated"}`);

  // 5. ADMIN — all stores
  const stores = await Store.findAll();
  for (const store of stores) {
    const [, storeCreated] = await Permission.findOrCreate({
      where: { menu_id: variantMenu.id, role_id: adminRole.id, store_id: store.id },
      defaults: { menu_id: variantMenu.id, role_id: adminRole.id, store_id: store.id, ...fullPerms },
    });
    if (!storeCreated) {
      await Permission.update(fullPerms, {
        where: { menu_id: variantMenu.id, role_id: adminRole.id, store_id: store.id },
      });
    }
    console.log(`Permission ADMIN / Variant Master / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
  }

  console.log("\nDone. Restart the server and log in again to see Variant Master in the sidebar.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
