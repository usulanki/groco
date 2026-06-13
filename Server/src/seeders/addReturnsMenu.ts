/**
 * One-shot script: inserts the "Returns" menu and grants full permissions
 * to SUPERADMIN (global) + ADMIN (per-store).
 * Safe to re-run — uses findOrCreate / upsert throughout.
 *
 * Run with: npx ts-node src/seeders/addReturnsMenu.ts
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

  const [returnsMenu, created] = await Menu.findOrCreate({
    where: { name: "Returns", parent_id: null },
    defaults: {
      name: "Returns",
      link: "/returns",
      sort_order: 5.85,
      icon: "returns",
      status: true,
      show_in_sidebar: true,
    },
  });

  if (!created) {
    await returnsMenu.update({ link: "/returns", icon: "returns", status: true, show_in_sidebar: true, sort_order: 5.85 });
  }
  console.log(`Menu "Returns": ${created ? "created" : "updated"} (id=${returnsMenu.id})`);

  const superadminRole = await Role.findOne({ where: { code: "SUPERADMIN" } });
  const adminRole      = await Role.findOne({ where: { code: "ADMIN" } });
  if (!superadminRole || !adminRole) {
    console.error("Roles not found. Run the main seed first.");
    process.exit(1);
  }

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };

  const [, saCreated] = await Permission.findOrCreate({
    where: { menu_id: returnsMenu.id, role_id: superadminRole.id, store_id: null },
    defaults: { menu_id: returnsMenu.id, role_id: superadminRole.id, store_id: null, ...fullPerms },
  });
  if (!saCreated) {
    await Permission.update(fullPerms, { where: { menu_id: returnsMenu.id, role_id: superadminRole.id, store_id: null } });
  }
  console.log(`Permission SUPERADMIN / Returns / global: ${saCreated ? "created" : "updated"}`);

  const stores = await Store.findAll({ where: { is_deleted: false } });
  for (const store of stores) {
    const [, storeCreated] = await Permission.findOrCreate({
      where: { menu_id: returnsMenu.id, role_id: adminRole.id, store_id: store.id },
      defaults: { menu_id: returnsMenu.id, role_id: adminRole.id, store_id: store.id, ...fullPerms },
    });
    if (!storeCreated) {
      await Permission.update(fullPerms, { where: { menu_id: returnsMenu.id, role_id: adminRole.id, store_id: store.id } });
    }
    console.log(`Permission ADMIN / Returns / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
  }

  console.log("\nDone. Returns menu is active and visible in the sidebar at sort_order=5.85.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
