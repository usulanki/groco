/**
 * Script: Grant upload permission for Products menu to all roles that already
 * have a permissions entry for /products (i.e. can view it).
 *
 * Safe to re-run (idempotent UPDATE).
 *
 * Run: npx tsx src/scripts/grantProductsUploadAllRoles.ts
 */
import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    const [menus] = await sequelize.query(
      "SELECT id FROM menus WHERE link = '/products' LIMIT 1"
    ) as [Array<{ id: number }>, unknown];

    if (!menus.length) throw new Error('Menu with link "/products" not found.');
    const menuId = menus[0]!.id;
    console.log(`Products menu id: ${menuId}`);

    const [result] = await sequelize.query(
      "UPDATE permissions SET upload = 1 WHERE menu_id = ?",
      { replacements: [menuId] }
    ) as [any, unknown];

    const affected = result?.affectedRows ?? result ?? "?";
    console.log(`Done. Updated ${affected} permission row(s) — upload = 1 for all roles on /products.`);

    await sequelize.close();
  } catch (err: any) {
    console.error("Script failed:", err.message);
    process.exit(1);
  }
})();
