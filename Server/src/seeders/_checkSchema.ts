import sequelize from "../config/database";
import "../models/index";

async function check() {
  await sequelize.authenticate();

  const [fkRefs] = await sequelize.query(`
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_NAME IN ('products','categories')
      AND TABLE_SCHEMA = DATABASE()
    ORDER BY REFERENCED_TABLE_NAME, TABLE_NAME
  `);
  console.log("FK refs on products/categories:");
  console.log(JSON.stringify(fkRefs, null, 2));

  for (const t of [
    "categories", "products", "product_variants", "product_outlets",
    "inventory", "order_items", "carts", "wishlists", "reviews", "media",
  ]) {
    try {
      const [[row]] = await sequelize.query(`SELECT COUNT(*) as n FROM \`${t}\``) as any;
      console.log(`${t}: ${row.n} rows`);
    } catch {
      console.log(`${t}: not found`);
    }
  }

  await sequelize.close();
}
check().catch(console.error);
