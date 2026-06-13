/**
 * One-shot script: restricts the "Admins" menu scope to ADMIN only.
 * After this, SUPERADMIN, MANAGER, and any other role will not see
 * the Admins menu in the sidebar or be granted permission to it.
 * Safe to re-run.
 *
 * Run with: npx tsx src/seeders/restrictAdminsMenuScope.ts
 */
import sequelize from "../config/database";
import "../models/index";
import Menu from "../models/menu.model";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const menu = await Menu.findOne({ where: { name: "Admins", parent_id: null } });
  if (!menu) {
    console.error("Admins menu not found.");
    process.exit(1);
  }

  await menu.update({ scope: "ADMIN" });
  console.log(`Menu "Admins" (id=${menu.id}) scope updated to "ADMIN".`);

  console.log("\nDone. Only ADMIN role will see the Admins menu.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
