/**
 * Adds a "Vendor Payments" sub-menu under the "Payments" parent menu.
 * show_in_sidebar = false so it never appears in the nav, but its
 * permission record controls the "New Payment" button in the UI.
 *
 * Grants full permissions to SUPERADMIN (global) and ADMIN (per-store).
 * Safe to re-run.
 *
 * Run: npx ts-node src/seeders/addVendorPaymentsSubMenu.ts
 */
import sequelize from "../config/database";
import "../models/index";
import Menu from "../models/menu.model";
import Role from "../models/role.model";
import Permission from "../models/permission.model";
import Store from "../models/store.model";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const paymentsMenu = await Menu.findOne({ where: { link: "/payments", parent_id: null } });
  if (!paymentsMenu) {
    console.error('Parent "Payments" menu not found. Run renameTransactionsToPayments.ts first.');
    process.exit(1);
  }

  const [menu, created] = await Menu.findOrCreate({
    where: { name: "Vendor Payments", parent_id: paymentsMenu.id },
    defaults: {
      name:            "Vendor Payments",
      link:            "/payments/vendor",
      parent_id:       paymentsMenu.id,
      sort_order:      paymentsMenu.sort_order! + 0.01,
      icon:            null,
      status:          true,
      show_in_sidebar: false,
    },
  });

  if (!created) {
    await menu.update({ link: "/payments/vendor", show_in_sidebar: false, status: true });
  }
  console.log(`Menu "Vendor Payments": ${created ? "created" : "updated"} (id=${menu.id})`);

  const superadminRole = await Role.findOne({ where: { code: "SUPERADMIN" } });
  const adminRole      = await Role.findOne({ where: { code: "ADMIN" } });
  if (!superadminRole || !adminRole) {
    console.error("Roles not found.");
    process.exit(1);
  }

  const fullPerms = { view: true, add: true, edit: true, delete: true, upload: true, download: true };
  const stores    = await Store.findAll({ where: { is_deleted: false } });

  // SUPERADMIN global
  const [, saCreated] = await Permission.findOrCreate({
    where:    { menu_id: menu.id, role_id: superadminRole.id, store_id: null },
    defaults: { menu_id: menu.id, role_id: superadminRole.id, store_id: null, ...fullPerms },
  });
  if (!saCreated) {
    await Permission.update(fullPerms, { where: { menu_id: menu.id, role_id: superadminRole.id, store_id: null } });
  }
  console.log(`Permission SUPERADMIN / Vendor Payments / global: ${saCreated ? "created" : "updated"}`);

  // ADMIN per-store
  for (const store of stores) {
    const [, storeCreated] = await Permission.findOrCreate({
      where:    { menu_id: menu.id, role_id: adminRole.id, store_id: store.id },
      defaults: { menu_id: menu.id, role_id: adminRole.id, store_id: store.id, ...fullPerms },
    });
    if (!storeCreated) {
      await Permission.update(fullPerms, { where: { menu_id: menu.id, role_id: adminRole.id, store_id: store.id } });
    }
    console.log(`  Permission ADMIN / Vendor Payments / store ${store.id}: ${storeCreated ? "created" : "updated"}`);
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
