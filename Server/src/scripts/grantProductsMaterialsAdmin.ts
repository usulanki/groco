/**
 * Grant full permissions (view, add, edit, delete, upload, download)
 * for Products and Materials menus to the ADMIN role on every store.
 *
 * Safe to run multiple times (upsert logic).
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/grantProductsMaterialsAdmin.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // ── Helper ─────────────────────────────────────────────────────────────────
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

    // ── Fetch menu IDs ─────────────────────────────────────────────────────────
    const [menus] = await sequelize.query(
      "SELECT id, name FROM menus WHERE link IN ('/products', '/materials')"
    ) as [Array<{ id: number; name: string }>, unknown];

    const menuMap = Object.fromEntries(menus.map((m) => [m.name, m.id]));
    console.log("Menus found:", menuMap);

    if (!menuMap["Products"]) throw new Error('Menu "Products" not found.');
    if (!menuMap["Materials"]) throw new Error('Menu "Materials" not found — run addMaterialsMenu.ts first.');

    // ── Fetch ADMIN role ───────────────────────────────────────────────────────
    const [roles] = await sequelize.query(
      "SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1"
    ) as [Array<{ id: number }>, unknown];

    if (!roles.length) throw new Error("ADMIN role not found.");
    const adminRoleId = roles[0]!.id;
    console.log(`ADMIN role id: ${adminRoleId}`);

    // ── Fetch all stores ───────────────────────────────────────────────────────
    const [stores] = await sequelize.query(
      "SELECT id FROM stores ORDER BY id ASC"
    ) as [Array<{ id: number }>, unknown];
    console.log(`Stores: ${stores.map((s) => s.id).join(", ")}`);

    // ── Upsert permissions ─────────────────────────────────────────────────────
    for (const [menuName, menuId] of Object.entries(menuMap) as [string, number][]) {
      for (const store of stores) {
        const result = await upsertPermission(menuId, adminRoleId, store.id);
        console.log(`ADMIN / ${menuName} / store ${store.id}: ${result}`);
      }
    }

    console.log("\nDone — full permissions granted for Products & Materials to ADMIN.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Script failed:", err.message);
    process.exit(1);
  }
})();
