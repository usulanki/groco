/**
 * Grants full Billing menu permissions to every SUPERADMIN and ADMIN admin.
 * Safe to re-run — upserts existing rows.
 */
import sequelize from "../config/database";
import "../models/index";
import Admin from "../models/admin.model";
import Role from "../models/role.model";
import Menu from "../models/menu.model";
import Permission from "../models/permission.model";

async function run() {
  await sequelize.authenticate();

  const billingMenu = await Menu.findOne({ where: { link: "/billing" } });
  if (!billingMenu) {
    console.error("Billing menu not found. Run the seed first.");
    process.exit(1);
  }
  console.log(`Billing menu found (id=${billingMenu.id})`);

  const targetRoles = await Role.findAll({ where: { code: ["SUPERADMIN", "ADMIN"] } });
  const targetRoleIds = targetRoles.map((r) => r.id);

  const admins = await Admin.findAll({ where: { role_id: targetRoleIds } });

  // Collect unique (role_id, store_id) pairs
  const pairs = new Map<string, { role_id: number; store_id: number | null }>();
  for (const admin of admins) {
    const storeId = admin.store_id ?? null;
    const key = `${admin.role_id}:${storeId}`;
    pairs.set(key, { role_id: admin.role_id, store_id: storeId });
  }

  console.log(`Found ${pairs.size} unique role+store pair(s) to grant.`);

  for (const { role_id, store_id } of pairs.values()) {
    const [perm, created] = await Permission.findOrCreate({
      where: { menu_id: billingMenu.id, role_id, store_id },
      defaults: {
        menu_id: billingMenu.id, role_id, store_id,
        view: true, add: true, edit: true, delete: true, upload: true, download: true,
      },
    });
    if (!created) {
      await perm.update({ view: true, add: true, edit: true, delete: true, upload: true, download: true });
    }
    const roleCode = targetRoles.find((r) => r.id === role_id)?.code ?? role_id;
    console.log(`Billing permission for ${roleCode} / store_id=${store_id ?? "null"}: ${created ? "created" : "updated"}`);
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
