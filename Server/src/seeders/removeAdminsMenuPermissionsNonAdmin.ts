/**
 * One-shot script: deletes all permission rows for the "Admins" menu
 * for every role except ADMIN.
 * Safe to re-run.
 *
 * Run with: npx tsx src/seeders/removeAdminsMenuPermissionsNonAdmin.ts
 */
import { Op } from "sequelize";
import sequelize from "../config/database";
import "../models/index";
import Role from "../models/role.model";
import Menu from "../models/menu.model";
import Permission from "../models/permission.model";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const adminRole = await Role.findOne({ where: { code: "ADMIN" } });
  if (!adminRole) {
    console.error("ADMIN role not found.");
    process.exit(1);
  }

  const adminsMenu = await Menu.findOne({ where: { name: "Admins", parent_id: null } });
  if (!adminsMenu) {
    console.error("Admins menu not found.");
    process.exit(1);
  }

  const deleted = await Permission.destroy({
    where: {
      menu_id: adminsMenu.id,
      role_id: { [Op.ne]: adminRole.id },
    },
  });

  console.log(`Deleted ${deleted} permission row(s) for Admins menu (non-ADMIN roles).`);
  console.log("\nDone.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
