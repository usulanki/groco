/**
 * One-shot script: inserts the "Promotions" parent menu with "Promotions" and
 * "Coupons" sub-menus, and grants full permissions to SUPERADMIN (global) +
 * ADMIN (per-store).
 * Safe to re-run — uses findOrCreate / upsert throughout.
 *
 * Run with: npx ts-node src/seeders/addPromotionsMenu.ts
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

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };

  // 1. Roles
  const superadminRole = await Role.findOne({ where: { code: "SUPERADMIN" } });
  const adminRole      = await Role.findOne({ where: { code: "ADMIN" } });
  if (!superadminRole || !adminRole) {
    console.error("Roles not found. Run the main seed first.");
    process.exit(1);
  }

  const stores = await Store.findAll({ where: { is_deleted: false } });

  async function grantPermissions(menu: Menu) {
    const [, saCreated] = await Permission.findOrCreate({
      where: { menu_id: menu.id, role_id: superadminRole!.id, store_id: null },
      defaults: { menu_id: menu.id, role_id: superadminRole!.id, store_id: null, ...fullPerms },
    });
    if (!saCreated) {
      await Permission.update(fullPerms, { where: { menu_id: menu.id, role_id: superadminRole!.id, store_id: null } });
    }
    console.log(`  Permission SUPERADMIN / ${menu.name} / global: ${saCreated ? "created" : "updated"}`);

    for (const store of stores) {
      const [, storeCreated] = await Permission.findOrCreate({
        where: { menu_id: menu.id, role_id: adminRole!.id, store_id: store.id },
        defaults: { menu_id: menu.id, role_id: adminRole!.id, store_id: store.id, ...fullPerms },
      });
      if (!storeCreated) {
        await Permission.update(fullPerms, { where: { menu_id: menu.id, role_id: adminRole!.id, store_id: store.id } });
      }
      console.log(`  Permission ADMIN / ${menu.name} / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
    }
  }

  // 2. Parent "Promotions" menu
  const [promotionsMenu, parentCreated] = await Menu.findOrCreate({
    where: { name: "Promotions", parent_id: null },
    defaults: {
      name:            "Promotions",
      link:            null,
      sort_order:      5.90,
      icon:            "promotions",
      status:          true,
      show_in_sidebar: true,
    },
  });
  if (!parentCreated) {
    await promotionsMenu.update({ link: null, icon: "promotions", status: true, show_in_sidebar: true, sort_order: 5.90 });
  }
  console.log(`Menu "Promotions" (parent): ${parentCreated ? "created" : "updated"} (id=${promotionsMenu.id})`);
  await grantPermissions(promotionsMenu);

  // 3. Sub-menus
  const subMenuDefs = [
    { name: "Promotions", link: "/promotions",         sort_order: 5.901 },
    { name: "Coupons",    link: "/promotions/coupons", sort_order: 5.902 },
  ];

  for (const def of subMenuDefs) {
    const [menu, created] = await Menu.findOrCreate({
      where: { name: def.name, parent_id: promotionsMenu.id },
      defaults: {
        name:            def.name,
        link:            def.link,
        parent_id:       promotionsMenu.id,
        sort_order:      def.sort_order,
        icon:            null,
        status:          true,
        show_in_sidebar: true,
      },
    });
    if (!created) {
      await menu.update({ link: def.link, show_in_sidebar: true, status: true, sort_order: def.sort_order });
    }
    console.log(`Menu "${def.name}" (child): ${created ? "created" : "updated"} (id=${menu.id})`);
    await grantPermissions(menu);
  }

  console.log("\nDone. Promotions menu is active and visible in the sidebar at sort_order=5.90.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
