import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected.");

    async function upsertPermission(menu_id: number, role_id: number, store_id: number | null) {
      const [rows] = await sequelize.query(
        `SELECT id FROM permissions WHERE menu_id = ? AND role_id = ? AND store_id ${store_id === null ? "IS NULL" : "= ?"}`,
        { replacements: store_id === null ? [menu_id, role_id] : [menu_id, role_id, store_id] }
      ) as [Array<{ id: number }>, unknown];
      if (rows.length > 0) {
        await sequelize.query(
          "UPDATE permissions SET `view`=1,`add`=1,edit=1,`delete`=1,upload=1,download=1 WHERE id=?",
          { replacements: [rows[0]!.id] }
        );
        return "updated";
      }
      await sequelize.query(
        "INSERT INTO permissions (menu_id, role_id, store_id, `view`, `add`, edit, `delete`, upload, download) VALUES (?,?,?,1,1,1,1,1,1)",
        { replacements: [menu_id, role_id, store_id] }
      );
      return "inserted";
    }

    // Upsert Purchases menu (visible, between Orders=5.0 and Customers=6.0)
    const [existing] = await sequelize.query(
      "SELECT id FROM menus WHERE name = 'Purchases' AND parent_id IS NULL"
    ) as [Array<{ id: number }>, unknown];

    let menuId: number;
    if (existing.length > 0) {
      menuId = existing[0]!.id;
      await sequelize.query(
        "UPDATE menus SET link='/purchases', sort_order=5.5, status=1, icon='purchases', scope='SUPERADMIN,ADMIN' WHERE id=?",
        { replacements: [menuId] }
      );
      console.log(`Menu "Purchases" already exists (id=${menuId}) — updated.`);
    } else {
      await sequelize.query(
        "INSERT INTO menus (name, link, sort_order, status, icon, scope) VALUES ('Purchases', '/purchases', 5.5, 1, 'purchases', 'SUPERADMIN,ADMIN')"
      );
      const [inserted] = await sequelize.query(
        "SELECT id FROM menus WHERE name = 'Purchases' AND parent_id IS NULL LIMIT 1"
      ) as [Array<{ id: number }>, unknown];
      menuId = inserted[0]!.id;
      console.log(`Menu "Purchases" created (id=${menuId}).`);
    }

    const [roles] = await sequelize.query(
      "SELECT id, code FROM roles WHERE code IN ('SUPERADMIN', 'ADMIN')"
    ) as [Array<{ id: number; code: string }>, unknown];
    const roleMap = Object.fromEntries(roles.map((r) => [r.code, r.id]));
    console.log("Roles:", roleMap);

    const saResult = await upsertPermission(menuId, roleMap["SUPERADMIN"]!, null);
    console.log(`SUPERADMIN / Purchases / global: ${saResult}`);

    const [stores] = await sequelize.query("SELECT id FROM stores ORDER BY id ASC") as [Array<{ id: number }>, unknown];
    for (const store of stores) {
      const result = await upsertPermission(menuId, roleMap["ADMIN"]!, store.id);
      console.log(`ADMIN / Purchases / store ${store.id}: ${result}`);
    }

    console.log("Purchases menu seeder complete.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
