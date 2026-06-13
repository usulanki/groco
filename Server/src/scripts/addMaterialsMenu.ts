/**
 * Seeder: Add Materials menu (hidden from sidebar, status=0) with full permissions
 * for SUPERADMIN (global) and ADMIN (all stores).
 *
 * The menu is intentionally kept hidden (status=0) so it does not appear
 * in the sidebar navigation, but permissions can be controlled per role.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/addMaterialsMenu.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // ── Helper: upsert permission ──────────────────────────────────────────────
    async function upsertPermission(data: {
      menu_id: number; role_id: number; store_id: number | null;
    }) {
      const [existing] = await sequelize.query(
        `SELECT id FROM permissions WHERE menu_id = ? AND role_id = ? AND store_id ${data.store_id === null ? "IS NULL" : "= ?"}`,
        { replacements: data.store_id === null ? [data.menu_id, data.role_id] : [data.menu_id, data.role_id, data.store_id] }
      ) as [Array<{ id: number }>, unknown];

      if (existing.length > 0) {
        await sequelize.query(
          "UPDATE permissions SET `view`=1,`add`=1,edit=1,`delete`=1,upload=1,download=1 WHERE id=?",
          { replacements: [existing[0]!.id] }
        );
        return "updated";
      }
      await sequelize.query(
        "INSERT INTO permissions (menu_id, role_id, store_id, `view`, `add`, edit, `delete`, upload, download) VALUES (?,?,?,1,1,1,1,1,1)",
        { replacements: [data.menu_id, data.role_id, data.store_id] }
      );
      return "created";
    }

    // ── 1. Upsert Materials menu (status=0 = hidden from sidebar) ─────────────
    const [existing] = await sequelize.query(
      "SELECT id FROM menus WHERE name = 'Materials' AND parent_id IS NULL"
    ) as [Array<{ id: number }>, unknown];

    let menuId: number;
    if (existing.length > 0) {
      menuId = existing[0]!.id;
      await sequelize.query(
        "UPDATE menus SET link='/materials', sort_order=3.5, status=0, icon='materials', scope='SUPERADMIN,ADMIN' WHERE id=?",
        { replacements: [menuId] }
      );
      console.log(`Menu "Materials" already exists (id=${menuId}) — updated.`);
    } else {
      await sequelize.query(
        "INSERT INTO menus (name, link, sort_order, status, icon, scope) VALUES ('Materials', '/materials', 3.5, 0, 'materials', 'SUPERADMIN,ADMIN')"
      );
      const [inserted] = await sequelize.query(
        "SELECT id FROM menus WHERE name = 'Materials' AND parent_id IS NULL LIMIT 1"
      ) as [Array<{ id: number }>, unknown];
      menuId = inserted[0]!.id;
      console.log(`Menu "Materials" created (id=${menuId}, hidden from sidebar).`);
    }

    // ── 2. Fetch roles ─────────────────────────────────────────────────────────
    const [roles] = await sequelize.query(
      "SELECT id, code FROM roles WHERE code IN ('SUPERADMIN', 'ADMIN')"
    ) as [Array<{ id: number; code: string }>, unknown];
    const roleMap = Object.fromEntries(roles.map((r) => [r.code, r.id]));
    console.log("Roles found:", roleMap);

    if (!roleMap["ADMIN"] || !roleMap["SUPERADMIN"]) {
      throw new Error("ADMIN or SUPERADMIN role not found in DB.");
    }

    // ── 3. SUPERADMIN — global permission (store_id = null) ───────────────────
    const saResult = await upsertPermission({ menu_id: menuId, role_id: roleMap["SUPERADMIN"]!, store_id: null });
    console.log(`Permission SUPERADMIN / Materials / global: ${saResult}`);

    // ── 4. ADMIN — permission per store ───────────────────────────────────────
    const [stores] = await sequelize.query("SELECT id FROM stores ORDER BY id ASC") as [Array<{ id: number }>, unknown];
    console.log(`Stores found: ${stores.map((s) => s.id).join(", ")}`);

    for (const store of stores) {
      const result = await upsertPermission({ menu_id: menuId, role_id: roleMap["ADMIN"]!, store_id: store.id });
      console.log(`Permission ADMIN / Materials / store ${store.id}: ${result}`);
    }

    console.log("\nMaterials menu seeder complete.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Seeder failed:", err.message);
    process.exit(1);
  }
})();
