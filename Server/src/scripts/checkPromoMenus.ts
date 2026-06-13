import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(
    "SELECT id, name, link, parent_id, show_in_sidebar FROM menus WHERE id IN (30,31,32)"
  ) as any;
  console.log("Promotion menus:");
  rows.forEach((r: any) => console.log(" ", JSON.stringify(r)));

  const [perms] = await sequelize.query(
    "SELECT menu_id, role_id, store_id, `view` FROM permissions WHERE menu_id IN (30,31,32)"
  ) as any;
  console.log(`\nPermissions (${perms.length} rows):`);
  perms.forEach((p: any) => console.log(" ", JSON.stringify(p)));

  await sequelize.close();
})().catch((e: any) => { console.error(e.message); process.exit(1); });
