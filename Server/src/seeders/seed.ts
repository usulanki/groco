import bcrypt from "bcryptjs";
import sequelize, { createSchemaIfNotExists } from "../config/database";
import "../models/index";
import Role from "../models/role.model";
import Admin from "../models/admin.model";
import Store from "../models/store.model";
import Outlet from "../models/outlet.model";
import Menu from "../models/menu.model";
import Permission from "../models/permission.model";
import CustomerGroup from "../models/customerGroup.model";

async function seed() {
  await createSchemaIfNotExists();
  await sequelize.authenticate();

  // Disable FK checks so sync can add constraints even with existing data,
  // then re-enable after roles are populated
  await sequelize.query("SET FOREIGN_KEY_CHECKS=0");
  await sequelize.sync();
  await sequelize.query("SET FOREIGN_KEY_CHECKS=1");

  // 1. System roles — no created_by, no store_id (insert first to satisfy FK on admins.role_id)
  const [superadminRole] = await Role.findOrCreate({
    where: { code: "SUPERADMIN" },
    defaults: { name: "Super Admin", code: "SUPERADMIN" },
  });
  const [adminRole] = await Role.findOrCreate({
    where: { code: "ADMIN" },
    defaults: { name: "Admin", code: "ADMIN" },
  });
  const [managerRole] = await Role.findOrCreate({
    where: { code: "MANAGER" },
    defaults: { name: "Manager", code: "MANAGER" },
  });
  console.log(`System roles seeded: SUPERADMIN(id=${superadminRole.id}), ADMIN(id=${adminRole.id}), MANAGER(id=${managerRole.id})`);

  // 2. Find existing superadmin — do not create a new one
  const superAdmin = await Admin.findOne({ where: { username: "superadmin" } });
  if (!superAdmin) {
    throw new Error("Superadmin not found in admins table. Ensure superadmin exists before running this seed.");
  }

  // Keep superadmin's role_id in sync with the SUPERADMIN role id
  if (superAdmin.role_id !== superadminRole.id) {
    await superAdmin.update({ role_id: superadminRole.id });
    console.log(`Updated superadmin role_id → ${superadminRole.id}`);
  } else {
    console.log(`Existing superadmin found (id=${superAdmin.id}), role_id already correct.`);
  }

  // 3. Dummy ADMIN admins
  const passwordHash = await bcrypt.hash("Password@123", 10);

  const [adminOne, createdOne] = await Admin.findOrCreate({
    where: { email: "alice@karto.com" },
    defaults: {
      fname: "Alice",
      lname: "Smith",
      email: "alice@karto.com",
      username: "alice.smith",
      password: passwordHash,
      role_id: adminRole.id,
    },
  });
  console.log(`Admin alice@karto.com: ${createdOne ? "created" : "already exists"} (id=${adminOne.id})`);

  const [adminTwo, createdTwo] = await Admin.findOrCreate({
    where: { email: "bob@karto.com" },
    defaults: {
      fname: "Bob",
      lname: "Jones",
      email: "bob@karto.com",
      username: "bob.jones",
      password: passwordHash,
      role_id: adminRole.id,
    },
  });
  console.log(`Admin bob@karto.com: ${createdTwo ? "created" : "already exists"} (id=${adminTwo.id})`);

  // 4. Dummy stores — owner must be an ADMIN-role admin
  const [storeOne, createdStore1] = await Store.findOrCreate({
    where: { name: "Karto Main Store" },
    defaults: { name: "Karto Main Store", owner_id: adminOne.id, created_by: superAdmin.id },
  });
  console.log(`Store "Karto Main Store": ${createdStore1 ? "created" : "already exists"} (id=${storeOne.id})`);

  const [storeTwo, createdStore2] = await Store.findOrCreate({
    where: { name: "Karto West Branch" },
    defaults: { name: "Karto West Branch", owner_id: adminTwo.id, created_by: superAdmin.id },
  });
  console.log(`Store "Karto West Branch": ${createdStore2 ? "created" : "already exists"} (id=${storeTwo.id})`);

  // 5. Custom store-scoped role for store 1
  const [customRole, createdCustom] = await Role.findOrCreate({
    where: { code: "STORE_MANAGER_1" },
    defaults: {
      name: "Store Manager",
      code: "STORE_MANAGER_1",
      store_id: storeOne.id,
      created_by: superAdmin.id,
    },
  });
  console.log(`Custom role STORE_MANAGER_1: ${createdCustom ? "created" : "already exists"} (id=${customRole.id})`);

  // 5b. Assign store_id to ADMIN admins
  await adminOne.update({ store_id: storeOne.id });
  await adminTwo.update({ store_id: storeTwo.id });
  console.log(`Assigned store_id to alice(${storeOne.id}) and bob(${storeTwo.id})`);

  // 6. Dummy MANAGER admins (one per outlet)
  const [managerOne, createdMgr1] = await Admin.findOrCreate({
    where: { email: "charlie@karto.com" },
    defaults: {
      fname: "Charlie",
      lname: "Brown",
      email: "charlie@karto.com",
      username: "charlie.brown",
      password: passwordHash,
      role_id: managerRole.id,
    },
  });
  await managerOne.update({ store_id: storeOne.id });
  console.log(`Manager charlie@karto.com: ${createdMgr1 ? "created" : "already exists"} (id=${managerOne.id})`);

  const [managerTwo, createdMgr2] = await Admin.findOrCreate({
    where: { email: "diana@karto.com" },
    defaults: {
      fname: "Diana",
      lname: "Prince",
      email: "diana@karto.com",
      username: "diana.prince",
      password: passwordHash,
      role_id: managerRole.id,
    },
  });
  await managerTwo.update({ store_id: storeOne.id });
  console.log(`Manager diana@karto.com: ${createdMgr2 ? "created" : "already exists"} (id=${managerTwo.id})`);

  const [managerThree, createdMgr3] = await Admin.findOrCreate({
    where: { email: "eve@karto.com" },
    defaults: {
      fname: "Eve",
      lname: "Wilson",
      email: "eve@karto.com",
      username: "eve.wilson",
      password: passwordHash,
      role_id: managerRole.id,
    },
  });
  await managerThree.update({ store_id: storeTwo.id });
  console.log(`Manager eve@karto.com: ${createdMgr3 ? "created" : "already exists"} (id=${managerThree.id})`);

  // 7. Dummy outlets — created_by must be the ADMIN of that store
  const [outlet1, createdOutlet1] = await Outlet.findOrCreate({
    where: { name: "Main Store - Downtown" },
    defaults: {
      name: "Main Store - Downtown",
      store_id: storeOne.id,
      manager_id: managerOne.id,
      location: "Downtown",
      latitude: 28.6139,
      longitude: 77.209,
      address1: "12 MG Road",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      created_by: adminOne.id,
    },
  });
  console.log(`Outlet "Main Store - Downtown": ${createdOutlet1 ? "created" : "already exists"} (id=${outlet1.id})`);

  const [outlet2, createdOutlet2] = await Outlet.findOrCreate({
    where: { name: "Main Store - Uptown" },
    defaults: {
      name: "Main Store - Uptown",
      store_id: storeOne.id,
      manager_id: managerTwo.id,
      location: "Uptown",
      latitude: 28.635,
      longitude: 77.225,
      address1: "45 Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110002",
      created_by: adminOne.id,
    },
  });
  console.log(`Outlet "Main Store - Uptown": ${createdOutlet2 ? "created" : "already exists"} (id=${outlet2.id})`);

  const [outlet3, createdOutlet3] = await Outlet.findOrCreate({
    where: { name: "West Branch - Central" },
    defaults: {
      name: "West Branch - Central",
      store_id: storeTwo.id,
      manager_id: managerThree.id,
      location: "Central",
      latitude: 19.076,
      longitude: 72.8777,
      address1: "78 Link Road",
      address2: "Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053",
      created_by: adminTwo.id,
    },
  });
  console.log(`Outlet "West Branch - Central": ${createdOutlet3 ? "created" : "already exists"} (id=${outlet3.id})`);

  // Customer groups — seeded per store
  const customerGroupDefs = [
    { code: "FIRST_USER", name: "First User" },
    { code: "STANDARD",   name: "Standard" },
    { code: "PREMIUM",    name: "Premium" },
  ];
  for (const store of [storeOne, storeTwo]) {
    for (const def of customerGroupDefs) {
      const [cg, cgCreated] = await CustomerGroup.findOrCreate({
        where: { code: def.code, store_id: store.id },
        defaults: { ...def, store_id: store.id },
      });
      console.log(`CustomerGroup "${def.name}" (store ${store.id}): ${cgCreated ? "created" : "already exists"} (id=${cg.id})`);
    }
  }

  // Helper to upsert a permission (create or update)
  async function upsertFullPermission(data: {
    menu_id: number; role_id: number; store_id: number | null;
    view: boolean; add: boolean; edit: boolean; delete: boolean; upload: boolean; download: boolean;
  }) {
    const existing = await Permission.findOne({
      where: { menu_id: data.menu_id, role_id: data.role_id, store_id: data.store_id ?? null },
    });
    if (existing) {
      await existing.update(data);
      return "updated";
    }
    await Permission.create(data);
    return "created";
  }

  // 8. Top-level menus (visible)
  const topMenuDefs = [
    { name: "Dashboard", link: "/dashboard", sort_order: 1.0, icon: "dashboard", status: true },
    { name: "Admins",    link: "/admins",    sort_order: 2.0, icon: "users",     status: true, scope: "ADMIN" },
    { name: "Products",  link: "/products",  sort_order: 3.0, icon: "products",  status: true },
    // Hidden sub-feature menus (status: false — excluded from sidebar nav)
    { name: "Materials", link: "/materials", sort_order: 3.5, icon: "materials", status: false },
    { name: "Masters",   link: null,         sort_order: 4.0, icon: "store",     status: true },
    { name: "Orders",    link: "/orders",    sort_order: 5.0, icon: "orders",    status: true },
    { name: "Customers", link: "/customers", sort_order: 6.0, icon: "customers", status: true },
    { name: "Reports",   link: "/reports",   sort_order: 7.0, icon: "reports",   status: true },
    // Hidden system menus (status: false — excluded from sidebar)
    { name: "Roles",       link: "/roles",       sort_order: 8.0, icon: "shield", status: false },
    { name: "Permissions", link: "/permissions", sort_order: 9.0, icon: "lock",   status: false },
  ];

  const topMenus: Record<string, Menu> = {};
  for (const def of topMenuDefs) {
    const [menu, created] = await Menu.findOrCreate({
      where: { name: def.name, parent_id: null },
      defaults: def,
    });
    topMenus[def.name] = menu;
    console.log(`Menu "${def.name}": ${created ? "created" : "already exists"} (id=${menu.id})`);
  }

  // 9. Masters submenus: Category, Tax, UOM
  const subMenuDefs = [
    { name: "Category",        link: "/categories",      sort_order: 4.1, icon: "categories",      parent: "Masters" },
    { name: "Tax",             link: "/tax",             sort_order: 4.2, icon: "tax",             parent: "Masters" },
    { name: "UOM",             link: "/uom",             sort_order: 4.3, icon: "uom",             parent: "Masters" },
    { name: "Customer Groups", link: "/customer-groups", sort_order: 4.4, icon: "customer-groups", parent: "Masters" },
    { name: "Variants",  link: "/variants",  sort_order: 4.5, icon: "variant-master",  parent: "Masters" },
  ];

  const subMenus: Record<string, Menu> = {};
  for (const def of subMenuDefs) {
    const parentMenu = topMenus[def.parent]!;
    const [menu, created] = await Menu.findOrCreate({
      where: { name: def.name, parent_id: parentMenu.id },
      defaults: { name: def.name, link: def.link, sort_order: def.sort_order, icon: def.icon, parent_id: parentMenu.id },
    });
    subMenus[def.name] = menu;
    console.log(`Submenu "${def.name}" (under ${def.parent}): ${created ? "created" : "already exists"} (id=${menu.id})`);
  }

  // 10. Permissions
  // The 10 menus that get full ADMIN/SUPERADMIN permissions (7 top-level + 3 Masters children)
  const permissionedMenus = [
    topMenus["Dashboard"]!, topMenus["Admins"]!, topMenus["Products"]!, topMenus["Materials"]!, topMenus["Masters"]!,
    subMenus["Category"]!, subMenus["Tax"]!, subMenus["UOM"]!, subMenus["Customer Groups"]!, subMenus["Variants"]!,
    topMenus["Orders"]!, topMenus["Customers"]!, topMenus["Reports"]!,
  ];

  const ordersMenu = topMenus["Orders"]!;
  const productsMenu = topMenus["Products"]!;

  // SUPERADMIN — global (no store), full permissions on all 9 menus
  for (const menu of permissionedMenus) {
    const result = await upsertFullPermission({
      menu_id: menu.id, role_id: superadminRole.id, store_id: null,
      view: true, add: true, edit: true, delete: true, upload: true, download: true,
    });
    console.log(`Permission SUPERADMIN / ${menu.name} / global: ${result}`);
  }

  // ADMIN — store 1 & 2, full permissions on all 9 menus
  for (const store of [storeOne, storeTwo]) {
    for (const menu of permissionedMenus) {
      const result = await upsertFullPermission({
        menu_id: menu.id, role_id: adminRole.id, store_id: store.id,
        view: true, add: true, edit: true, delete: true, upload: true, download: true,
      });
      console.log(`Permission ADMIN / ${menu.name} / store ${store.id}: ${result}`);
    }
  }

  // MANAGER — store 1 & 2, Dashboard (full) + Orders + Products (view + download only)
  const dashboardMenu = topMenus["Dashboard"]!;
  for (const store of [storeOne, storeTwo]) {
    // Dashboard: full permissions
    const dashResult = await upsertFullPermission({
      menu_id: dashboardMenu.id, role_id: managerRole.id, store_id: store.id,
      view: true, add: true, edit: true, delete: true, upload: true, download: true,
    });
    console.log(`Permission MANAGER / Dashboard / store ${store.id}: ${dashResult}`);

    // Orders + Products: view + download only
    for (const menu of [ordersMenu, productsMenu]) {
      const result = await upsertFullPermission({
        menu_id: menu.id, role_id: managerRole.id, store_id: store.id,
        view: true, add: false, edit: false, delete: false, upload: false, download: true,
      });
      console.log(`Permission MANAGER / ${menu.name} / store ${store.id}: ${result}`);
    }
  }

  console.log("\nSeeding complete.");
  await sequelize.close();
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
