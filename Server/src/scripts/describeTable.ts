import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  const table = process.argv[2] || "customer_groups";
  try {
    const [rows] = await sequelize.query(`DESCRIBE \`${table}\``) as any;
    rows.forEach((r: any) => console.log(`  ${r.Field}  |  ${r.Type}  |  null:${r.Null}  |  default:${r.Default}`));
  } catch (e: any) {
    console.log("Error:", e.message);
  }
  await sequelize.close();
})();
