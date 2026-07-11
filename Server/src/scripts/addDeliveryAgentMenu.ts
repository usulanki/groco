/**
 * Adds "Delivery" menu entry visible to SUPERADMIN only (scope='SUPERADMIN').
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/addDeliveryAgentMenu.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // ── 1. Upsert Delivery menu ────────────────────────────────────────────────
    const [existing] = await sequelize.query(
      "SELECT id FROM menus WHERE link = '/delivery-agents' LIMIT 1"
    ) as [Array<{ id: number }>, unknown];

    let menuId: number;
    if (existing.length > 0) {
      menuId = existing[0]!.id;
      await sequelize.query(
        "UPDATE menus SET name='Delivery', sort_order=4, status=1, show_in_sidebar=1, icon='delivery', scope='SUPERADMIN' WHERE id=?",
        { replacements: [menuId] }
      );
      console.log(`Menu "Delivery" already exists (id=${menuId}) — updated.`);
    } else {
      await sequelize.query(
        "INSERT INTO menus (name, link, sort_order, status, show_in_sidebar, icon, scope) VALUES ('Delivery', '/delivery-agents', 4, 1, 1, 'delivery', 'SUPERADMIN')"
      );
      const [inserted] = await sequelize.query(
        "SELECT id FROM menus WHERE link = '/delivery-agents' LIMIT 1"
      ) as [Array<{ id: number }>, unknown];
      menuId = inserted[0]!.id;
      console.log(`Menu "Delivery" created (id=${menuId}).`);
    }

    // ── 2. SUPERADMIN global permission (store_id = null) ─────────────────────
    const [roles] = await sequelize.query(
      "SELECT id, code FROM roles WHERE code = 'SUPERADMIN'"
    ) as [Array<{ id: number; code: string }>, unknown];

    if (!roles.length) throw new Error("SUPERADMIN role not found in DB.");
    const saRoleId = roles[0]!.id;

    const [permExisting] = await sequelize.query(
      "SELECT id FROM permissions WHERE menu_id = ? AND role_id = ? AND store_id IS NULL",
      { replacements: [menuId, saRoleId] }
    ) as [Array<{ id: number }>, unknown];

    if (permExisting.length > 0) {
      await sequelize.query(
        "UPDATE permissions SET `view`=1,`add`=1,edit=1,`delete`=1,upload=0,download=0 WHERE id=?",
        { replacements: [permExisting[0]!.id] }
      );
      console.log("Permission SUPERADMIN / Delivery / global: updated");
    } else {
      await sequelize.query(
        "INSERT INTO permissions (menu_id, role_id, store_id, `view`, `add`, edit, `delete`, upload, download) VALUES (?,?,NULL,1,1,1,1,0,0)",
        { replacements: [menuId, saRoleId] }
      );
      console.log("Permission SUPERADMIN / Delivery / global: created");
    }

    console.log("\nDelivery menu seeder complete.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Seeder failed:", err.message);
    process.exit(1);
  }
})();
