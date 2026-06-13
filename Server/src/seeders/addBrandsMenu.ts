/**
 * One-shot script: creates the "brands" table, inserts the "Brands" submenu
 * under Masters, and grants full permissions to SUPERADMIN + ADMIN roles.
 * Safe to re-run — uses findOrCreate / upsert throughout.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/seeders/addBrandsMenu.ts
 */
import sequelize from "../config/database";
import "../models/index";
import Role from "../models/role.model";
import Menu from "../models/menu.model";
import Permission from "../models/permission.model";
import Store from "../models/store.model";
import Brand from "../models/brand.model";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  // 1. Create brands table if it doesn't exist
  await Brand.sync({ alter: false });
  console.log('Table "brands": synced.');

  // 2. Find the Masters parent menu
  const mastersMenu = await Menu.findOne({ where: { name: "Masters", parent_id: null } });
  if (!mastersMenu) {
    console.error('Could not find "Masters" parent menu. Run updateMenus.ts first.');
    process.exit(1);
  }

  // 3. Find or create Brands submenu under Masters
  const [brandMenu, created] = await Menu.findOrCreate({
    where: { name: "Brands", parent_id: mastersMenu.id },
    defaults: {
      name: "Brands",
      link: "/brands",
      sort_order: 4.6,
      icon: "brands",
      parent_id: mastersMenu.id,
      status: true,
    },
  });

  if (!created) {
    await brandMenu.update({ link: "/brands", sort_order: 4.6, icon: "brands", status: true });
  }
  console.log(`Menu "Brands": ${created ? "created" : "already exists, updated"} (id=${brandMenu.id})`);

  // 4. Fetch roles
  const superadminRole = await Role.findOne({ where: { code: "SUPERADMIN" } });
  const adminRole      = await Role.findOne({ where: { code: "ADMIN" } });
  if (!superadminRole || !adminRole) {
    console.error("SUPERADMIN or ADMIN role not found. Run the main seed first.");
    process.exit(1);
  }

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };

  // 5. SUPERADMIN — global permission (store_id = null)
  const [, saCreated] = await Permission.findOrCreate({
    where: { menu_id: brandMenu.id, role_id: superadminRole.id, store_id: null },
    defaults: { menu_id: brandMenu.id, role_id: superadminRole.id, store_id: null, ...fullPerms },
  });
  if (!saCreated) {
    await Permission.update(fullPerms, {
      where: { menu_id: brandMenu.id, role_id: superadminRole.id, store_id: null },
    });
  }
  console.log(`Permission SUPERADMIN / Brands / global: ${saCreated ? "created" : "updated"}`);

  // 6. ADMIN — all stores
  const stores = await Store.findAll();
  for (const store of stores) {
    const [, storeCreated] = await Permission.findOrCreate({
      where: { menu_id: brandMenu.id, role_id: adminRole.id, store_id: store.id },
      defaults: { menu_id: brandMenu.id, role_id: adminRole.id, store_id: store.id, ...fullPerms },
    });
    if (!storeCreated) {
      await Permission.update(fullPerms, {
        where: { menu_id: brandMenu.id, role_id: adminRole.id, store_id: store.id },
      });
    }
    console.log(`Permission ADMIN / Brands / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
  }

  console.log("\nDone. Restart the server and log in again to see Brands under Masters in the sidebar.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
