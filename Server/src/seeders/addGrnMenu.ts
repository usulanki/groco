/**
 * One-shot script: inserts the "GRN" menu (hidden from sidebar) and grants
 * full permissions to SUPERADMIN (global) + ADMIN (per-store).
 * Safe to re-run — uses findOrCreate / upsert throughout.
 *
 * Run with: npx ts-node src/seeders/addGrnMenu.ts
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

  // 1. Find or create GRN menu (not shown in sidebar)
  const [grnMenu, created] = await Menu.findOrCreate({
    where: { name: "GRN", parent_id: null },
    defaults: {
      name: "GRN",
      link: "/grn",
      sort_order: 5.75,
      icon: "grn",
      status: true,
      show_in_sidebar: true,
    },
  });

  if (!created) {
    await grnMenu.update({ link: "/grn", icon: "grn", status: true, show_in_sidebar: true, sort_order: 5.75 });
  }
  console.log(`Menu "GRN": ${created ? "created" : "updated"} (id=${grnMenu.id})`);

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
    where: { menu_id: grnMenu.id, role_id: superadminRole.id, store_id: null },
    defaults: { menu_id: grnMenu.id, role_id: superadminRole.id, store_id: null, ...fullPerms },
  });
  if (!saCreated) {
    await Permission.update(fullPerms, { where: { menu_id: grnMenu.id, role_id: superadminRole.id, store_id: null } });
  }
  console.log(`Permission SUPERADMIN / GRN / global: ${saCreated ? "created" : "updated"}`);

  // 4. ADMIN — all stores
  const stores = await Store.findAll({ where: { is_deleted: false } });
  for (const store of stores) {
    const [, storeCreated] = await Permission.findOrCreate({
      where: { menu_id: grnMenu.id, role_id: adminRole.id, store_id: store.id },
      defaults: { menu_id: grnMenu.id, role_id: adminRole.id, store_id: store.id, ...fullPerms },
    });
    if (!storeCreated) {
      await Permission.update(fullPerms, { where: { menu_id: grnMenu.id, role_id: adminRole.id, store_id: store.id } });
    }
    console.log(`Permission ADMIN / GRN / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
  }

  console.log("\nDone. GRN menu is active and visible in the sidebar at sort_order=5.75.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
