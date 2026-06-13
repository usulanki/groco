/**
 * One-shot script: inserts "Purchase Return" and "Order Return" sub-menus under Returns
 * (hidden from sidebar), and grants full permissions to SUPERADMIN (global) + ADMIN (per-store).
 * Safe to re-run — uses findOrCreate / upsert throughout.
 *
 * Run with: npx ts-node src/seeders/addReturnSubMenus.ts
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

  // Resolve parent Returns menu
  const returnsMenu = await Menu.findOne({ where: { link: "/returns" } });
  if (!returnsMenu) {
    console.error('Parent "Returns" menu not found. Run addReturnsMenu.ts first.');
    process.exit(1);
  }

  const superadminRole = await Role.findOne({ where: { code: "SUPERADMIN" } });
  const adminRole      = await Role.findOne({ where: { code: "ADMIN" } });
  if (!superadminRole || !adminRole) {
    console.error("Roles not found.");
    process.exit(1);
  }

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };
  const stores = await Store.findAll({ where: { is_deleted: false } });

  const subMenuDefs = [
    { name: "Purchase Return", link: "/returns/purchase", sort_order: 5.851 },
    { name: "Order Return",    link: "/returns/order",    sort_order: 5.852 },
  ];

  for (const def of subMenuDefs) {
    const [menu, created] = await Menu.findOrCreate({
      where: { name: def.name, parent_id: returnsMenu.id },
      defaults: {
        name:           def.name,
        link:           def.link,
        parent_id:      returnsMenu.id,
        sort_order:     def.sort_order,
        icon:           null,
        status:         true,
        show_in_sidebar: false,
      },
    });
    if (!created) {
      await menu.update({ link: def.link, show_in_sidebar: false, status: true, sort_order: def.sort_order });
    }
    console.log(`Menu "${def.name}": ${created ? "created" : "updated"} (id=${menu.id})`);

    // SUPERADMIN global permission
    const [, saCreated] = await Permission.findOrCreate({
      where: { menu_id: menu.id, role_id: superadminRole.id, store_id: null },
      defaults: { menu_id: menu.id, role_id: superadminRole.id, store_id: null, ...fullPerms },
    });
    if (!saCreated) {
      await Permission.update(fullPerms, { where: { menu_id: menu.id, role_id: superadminRole.id, store_id: null } });
    }
    console.log(`  Permission SUPERADMIN / ${def.name} / global: ${saCreated ? "created" : "updated"}`);

    // ADMIN per-store permissions
    for (const store of stores) {
      const [, storeCreated] = await Permission.findOrCreate({
        where: { menu_id: menu.id, role_id: adminRole.id, store_id: store.id },
        defaults: { menu_id: menu.id, role_id: adminRole.id, store_id: store.id, ...fullPerms },
      });
      if (!storeCreated) {
        await Permission.update(fullPerms, { where: { menu_id: menu.id, role_id: adminRole.id, store_id: store.id } });
      }
      console.log(`  Permission ADMIN / ${def.name} / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
    }
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
