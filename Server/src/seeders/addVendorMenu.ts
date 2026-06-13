/**
 * One-shot script: inserts the "Vendors" top-level menu at sort_order 2.5
 * (between Admins and Products) and grants full permissions to SUPERADMIN + ADMIN.
 * Safe to re-run — uses findOrCreate / upsert throughout.
 *
 * Run with: npx ts-node src/seeders/addVendorMenu.ts
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

  // 1. Find or create Vendors top-level menu
  const [vendorMenu, created] = await Menu.findOrCreate({
    where: { name: "Vendors", parent_id: null },
    defaults: {
      name: "Vendors",
      link: "/vendors",
      sort_order: 2.5,
      icon: "vendor",
      status: true,
    },
  });

  if (!created) {
    await vendorMenu.update({ link: "/vendors", sort_order: 2.5, icon: "vendor", status: true });
  }
  console.log(`Menu "Vendors": ${created ? "created" : "updated"} (id=${vendorMenu.id})`);

  // 2. Roles
  const superadminRole = await Role.findOne({ where: { code: "SUPERADMIN" } });
  const adminRole      = await Role.findOne({ where: { code: "ADMIN" } });
  if (!superadminRole || !adminRole) {
    console.error("Roles not found. Run the main seed first.");
    process.exit(1);
  }

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };

  // 3. SUPERADMIN — global
  const [, saCreated] = await Permission.findOrCreate({
    where: { menu_id: vendorMenu.id, role_id: superadminRole.id, store_id: null },
    defaults: { menu_id: vendorMenu.id, role_id: superadminRole.id, store_id: null, ...fullPerms },
  });
  if (!saCreated) {
    await Permission.update(fullPerms, { where: { menu_id: vendorMenu.id, role_id: superadminRole.id, store_id: null } });
  }
  console.log(`Permission SUPERADMIN / Vendors / global: ${saCreated ? "created" : "updated"}`);

  // 4. ADMIN — all stores
  const stores = await Store.findAll({ where: { is_deleted: false } });
  for (const store of stores) {
    const [, storeCreated] = await Permission.findOrCreate({
      where: { menu_id: vendorMenu.id, role_id: adminRole.id, store_id: store.id },
      defaults: { menu_id: vendorMenu.id, role_id: adminRole.id, store_id: store.id, ...fullPerms },
    });
    if (!storeCreated) {
      await Permission.update(fullPerms, { where: { menu_id: vendorMenu.id, role_id: adminRole.id, store_id: store.id } });
    }
    console.log(`Permission ADMIN / Vendors / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
  }

  console.log("\nDone. Restart the server and log in again to see Vendors in the sidebar.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
