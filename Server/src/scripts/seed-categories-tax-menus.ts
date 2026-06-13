import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();

    // Helper: upsert permission
    async function upsertPermission(data: {
      menu_id: number; role_id: number; store_id: number | null;
      view: boolean; add: boolean; edit: boolean; delete: boolean;
      upload: boolean; download: boolean;
    }) {
      const [existing] = await sequelize.query(
        `SELECT id FROM permissions WHERE menu_id = ? AND role_id = ? AND store_id ${data.store_id === null ? "IS NULL" : "= ?"}`,
        { replacements: data.store_id === null ? [data.menu_id, data.role_id] : [data.menu_id, data.role_id, data.store_id] }
      ) as [Array<{ id: number }>, unknown];

      if (existing.length === 0) {
        await sequelize.query(
          `INSERT INTO permissions (menu_id, role_id, store_id, \`view\`, \`add\`, edit, \`delete\`, upload, download)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          { replacements: [data.menu_id, data.role_id, data.store_id, data.view, data.add, data.edit, data.delete, data.upload, data.download] }
        );
        return "created";
      }
      return "already exists";
    }

    // Fetch role IDs
    const [roles] = await sequelize.query(
      "SELECT id, code FROM roles WHERE code IN ('SUPERADMIN','ADMIN','MANAGER')"
    ) as [Array<{ id: number; code: string }>, unknown];
    const roleMap = Object.fromEntries(roles.map((r) => [r.code, r.id]));

    // Fetch store IDs
    const [stores] = await sequelize.query("SELECT id FROM stores ORDER BY id ASC") as [Array<{ id: number }>, unknown];
    const storeIds = stores.map((s) => s.id);

    // --- Categories menu ---
    const [catRows] = await sequelize.query(
      "SELECT id FROM menus WHERE name = 'Categories' AND parent_id IS NULL"
    ) as [Array<{ id: number }>, unknown];

    let catMenuId: number;
    if (catRows.length === 0) {
      const [result] = await sequelize.query(
        "INSERT INTO menus (name, link, sort_order, status, icon) VALUES ('Categories', '/categories', 8.0, 1, 'folder')"
      ) as [{ insertId: number }, unknown];
      catMenuId = (result as any).insertId ?? (result as any);
      // re-fetch if needed
      if (!catMenuId) {
        const [r] = await sequelize.query("SELECT id FROM menus WHERE name='Categories' AND parent_id IS NULL") as [Array<{ id: number }>, unknown];
        catMenuId = r[0]!.id;
      }
      console.log(`Menu "Categories": created (id=${catMenuId})`);
    } else {
      catMenuId = catRows[0]!.id;
      console.log(`Menu "Categories": already exists (id=${catMenuId})`);
    }

    const catPermDefs = [
      { role: "SUPERADMIN", store_id: null,       view: true,  add: true,  edit: true,  del: true  },
      ...storeIds.flatMap((sid) => [
        { role: "ADMIN",    store_id: sid,         view: true,  add: true,  edit: true,  del: false },
        { role: "MANAGER",  store_id: sid,         view: true,  add: false, edit: false, del: false },
      ]),
    ];

    for (const p of catPermDefs) {
      const r = await upsertPermission({ menu_id: catMenuId, role_id: roleMap[p.role]!, store_id: p.store_id, view: p.view, add: p.add, edit: p.edit, delete: p.del, upload: false, download: false });
      console.log(`Permission ${p.role} / Categories / store ${p.store_id ?? "global"}: ${r}`);
    }

    // --- Tax menu ---
    const [taxRows] = await sequelize.query(
      "SELECT id FROM menus WHERE name = 'Tax' AND parent_id IS NULL"
    ) as [Array<{ id: number }>, unknown];

    let taxMenuId: number;
    if (taxRows.length === 0) {
      const [result] = await sequelize.query(
        "INSERT INTO menus (name, link, sort_order, status, icon) VALUES ('Tax', '/tax', 9.0, 1, 'percent')"
      ) as [{ insertId: number }, unknown];
      taxMenuId = (result as any).insertId ?? (result as any);
      if (!taxMenuId) {
        const [r] = await sequelize.query("SELECT id FROM menus WHERE name='Tax' AND parent_id IS NULL") as [Array<{ id: number }>, unknown];
        taxMenuId = r[0]!.id;
      }
      console.log(`Menu "Tax": created (id=${taxMenuId})`);
    } else {
      taxMenuId = taxRows[0]!.id;
      console.log(`Menu "Tax": already exists (id=${taxMenuId})`);
    }

    const taxPermDefs = [
      { role: "SUPERADMIN", store_id: null,       view: true,  add: true,  edit: true,  del: true  },
      ...storeIds.flatMap((sid) => [
        { role: "ADMIN",    store_id: sid,         view: true,  add: true,  edit: true,  del: false },
        { role: "MANAGER",  store_id: sid,         view: true,  add: false, edit: false, del: false },
      ]),
    ];

    for (const p of taxPermDefs) {
      const r = await upsertPermission({ menu_id: taxMenuId, role_id: roleMap[p.role]!, store_id: p.store_id, view: p.view, add: p.add, edit: p.edit, delete: p.del, upload: false, download: false });
      console.log(`Permission ${p.role} / Tax / store ${p.store_id ?? "global"}: ${r}`);
    }

    console.log("\nDone.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
