import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();

    // Helper: upsert permission (create or update)
    async function upsertFullPermission(data: {
      menu_id: number; role_id: number; store_id: number | null;
      view: boolean; add: boolean; edit: boolean; delete: boolean; upload: boolean; download: boolean;
    }) {
      const [existing] = await sequelize.query(
        `SELECT id FROM permissions WHERE menu_id = ? AND role_id = ? AND store_id ${data.store_id === null ? "IS NULL" : "= ?"}`,
        { replacements: data.store_id === null ? [data.menu_id, data.role_id] : [data.menu_id, data.role_id, data.store_id] }
      ) as [Array<{ id: number }>, unknown];

      if (existing.length > 0) {
        await sequelize.query(
          "UPDATE permissions SET `view`=?,`add`=?,edit=?,`delete`=?,upload=?,download=? WHERE id=?",
          { replacements: [data.view, data.add, data.edit, data.delete, data.upload, data.download, existing[0]!.id] }
        );
        return "updated";
      }
      await sequelize.query(
        "INSERT INTO permissions (menu_id, role_id, store_id, `view`, `add`, edit, `delete`, upload, download) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        { replacements: [data.menu_id, data.role_id, data.store_id, data.view, data.add, data.edit, data.delete, data.upload, data.download] }
      );
      return "created";
    }

    // 1. Fetch role IDs and store IDs
    const [roles] = await sequelize.query(
      "SELECT id, code FROM roles WHERE code IN ('SUPERADMIN', 'ADMIN')"
    ) as [Array<{ id: number; code: string }>, unknown];
    const roleMap = Object.fromEntries(roles.map((r) => [r.code, r.id]));
    console.log("Roles:", roleMap);

    const [stores] = await sequelize.query("SELECT id FROM stores ORDER BY id ASC") as [Array<{ id: number }>, unknown];
    const storeIds = stores.map((s) => s.id);
    console.log("Store IDs:", storeIds);

    if (!roleMap["ADMIN"] || !roleMap["SUPERADMIN"]) {
      throw new Error("Required roles not found. Ensure ADMIN and SUPERADMIN roles exist.");
    }

    // 2. Rename Users → Admins
    await sequelize.query(
      "UPDATE menus SET name = 'Admins', link = '/admins', sort_order = 2.0 WHERE name = 'Users' AND parent_id IS NULL"
    );
    console.log('Menu "Users" → "Admins": updated');

    // 3. Reorder Orders and fix icon
    await sequelize.query(
      "UPDATE menus SET sort_order = 5.0, icon = 'orders' WHERE name = 'Orders' AND parent_id IS NULL"
    );
    console.log('Menu "Orders": sort_order=5.0, icon=orders');

    // 4. Reorder Reports and fix icon
    await sequelize.query(
      "UPDATE menus SET sort_order = 7.0, icon = 'reports' WHERE name = 'Reports' AND parent_id IS NULL"
    );
    console.log('Menu "Reports": sort_order=7.0, icon=reports');

    // 5. Fix Products icon
    await sequelize.query(
      "UPDATE menus SET icon = 'products' WHERE name = 'Products' AND parent_id IS NULL"
    );
    console.log('Menu "Products": icon=products');

    // 6. Hide Roles
    await sequelize.query(
      "UPDATE menus SET status = 0 WHERE name = 'Roles' AND parent_id IS NULL"
    );
    console.log('Menu "Roles": status=false');

    // 7. Hide Permissions
    await sequelize.query(
      "UPDATE menus SET status = 0 WHERE name = 'Permissions' AND parent_id IS NULL"
    );
    console.log('Menu "Permissions": status=false');

    // 8. Create Masters menu if not exists
    const [mastersRows] = await sequelize.query(
      "SELECT id FROM menus WHERE name = 'Masters' AND parent_id IS NULL"
    ) as [Array<{ id: number }>, unknown];

    let mastersId: number;
    if (mastersRows.length === 0) {
      const [result] = await sequelize.query(
        "INSERT INTO menus (name, link, sort_order, status, icon) VALUES ('Masters', NULL, 4.0, 1, 'store')"
      ) as [{ insertId: number }, unknown];
      mastersId = (result as any).insertId;
      if (!mastersId) {
        const [r] = await sequelize.query("SELECT id FROM menus WHERE name = 'Masters' AND parent_id IS NULL") as [Array<{ id: number }>, unknown];
        mastersId = r[0]!.id;
      }
      console.log(`Menu "Masters": created (id=${mastersId})`);
    } else {
      mastersId = mastersRows[0]!.id;
      await sequelize.query(
        "UPDATE menus SET sort_order = 4.0, status = 1, icon = 'store', link = NULL WHERE id = ?",
        { replacements: [mastersId] }
      );
      console.log(`Menu "Masters": already exists (id=${mastersId})`);
    }

    // 9. Move Categories → Category under Masters
    const [catRows] = await sequelize.query(
      "SELECT id FROM menus WHERE name IN ('Categories', 'Category') LIMIT 1"
    ) as [Array<{ id: number }>, unknown];

    if (catRows.length > 0) {
      const catId = catRows[0]!.id;
      await sequelize.query(
        "UPDATE menus SET name = 'Category', parent_id = ?, sort_order = 4.1, icon = 'categories', link = '/categories' WHERE id = ?",
        { replacements: [mastersId, catId] }
      );
      console.log(`Menu "Category": moved under Masters (id=${catId})`);
    } else {
      console.warn('Menu "Categories"/"Category" not found — skipping');
    }

    // 10. Move Tax under Masters
    const [taxRows] = await sequelize.query(
      "SELECT id FROM menus WHERE name = 'Tax' LIMIT 1"
    ) as [Array<{ id: number }>, unknown];

    if (taxRows.length > 0) {
      const taxId = taxRows[0]!.id;
      await sequelize.query(
        "UPDATE menus SET parent_id = ?, sort_order = 4.2, icon = 'tax', link = '/tax' WHERE id = ?",
        { replacements: [mastersId, taxId] }
      );
      console.log(`Menu "Tax": moved under Masters (id=${taxId})`);
    } else {
      console.warn('Menu "Tax" not found — skipping');
    }

    // 11. Create Customers menu if not exists
    const [custRows] = await sequelize.query(
      "SELECT id FROM menus WHERE name = 'Customers' AND parent_id IS NULL"
    ) as [Array<{ id: number }>, unknown];

    let customersId: number;
    if (custRows.length === 0) {
      const [result] = await sequelize.query(
        "INSERT INTO menus (name, link, sort_order, status, icon) VALUES ('Customers', '/customers', 6.0, 1, 'customers')"
      ) as [{ insertId: number }, unknown];
      customersId = (result as any).insertId;
      if (!customersId) {
        const [r] = await sequelize.query("SELECT id FROM menus WHERE name = 'Customers' AND parent_id IS NULL") as [Array<{ id: number }>, unknown];
        customersId = r[0]!.id;
      }
      console.log(`Menu "Customers": created (id=${customersId})`);
    } else {
      customersId = custRows[0]!.id;
      await sequelize.query(
        "UPDATE menus SET sort_order = 6.0, status = 1, icon = 'customers', link = '/customers' WHERE id = ?",
        { replacements: [customersId] }
      );
      console.log(`Menu "Customers": already exists (id=${customersId})`);
    }

    // 12. Fetch all 9 target menu IDs for permission grants
    const [menuRows] = await sequelize.query(
      "SELECT id, name FROM menus WHERE name IN ('Dashboard','Admins','Products','Masters','Orders','Customers','Reports','Category','Tax')"
    ) as [Array<{ id: number; name: string }>, unknown];
    const menuMap = Object.fromEntries(menuRows.map((m) => [m.name, m.id]));

    const targetMenuNames = ["Dashboard", "Admins", "Products", "Masters", "Category", "Tax", "Orders", "Customers", "Reports"];
    const missingMenus = targetMenuNames.filter((n) => !menuMap[n]);
    if (missingMenus.length > 0) {
      throw new Error(`Missing menus in DB: ${missingMenus.join(", ")}`);
    }

    // 13. Upsert full ADMIN permissions for both stores
    for (const storeId of storeIds) {
      for (const menuName of targetMenuNames) {
        const result = await upsertFullPermission({
          menu_id: menuMap[menuName]!, role_id: roleMap["ADMIN"]!, store_id: storeId,
          view: true, add: true, edit: true, delete: true, upload: true, download: true,
        });
        console.log(`Permission ADMIN / ${menuName} / store ${storeId}: ${result}`);
      }
    }

    // 14. Upsert full SUPERADMIN permissions (global, store_id=null)
    for (const menuName of targetMenuNames) {
      const result = await upsertFullPermission({
        menu_id: menuMap[menuName]!, role_id: roleMap["SUPERADMIN"]!, store_id: null,
        view: true, add: true, edit: true, delete: true, upload: true, download: true,
      });
      console.log(`Permission SUPERADMIN / ${menuName} / global: ${result}`);
    }

    console.log("\nMenu update complete.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
