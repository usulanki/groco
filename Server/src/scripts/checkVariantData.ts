import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();

  const [attrs] = await sequelize.query(
    `SELECT va.id, va.name, va.store_id,
            GROUP_CONCAT(vav.value ORDER BY vav.sort_order SEPARATOR ', ') as values_list,
            COUNT(vav.id) as value_count
     FROM variant_attributes va
     LEFT JOIN variant_attribute_values vav ON vav.attribute_id = va.id
     WHERE va.is_deleted = 0
     GROUP BY va.id ORDER BY va.id`
  ) as [any[], any];
  console.log("\n=== VARIANT ATTRIBUTES ===");
  console.table(attrs);

  const [cats] = await sequelize.query(
    `SELECT c.id, c.name, c.parent_id,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_deleted = 0) as product_count
     FROM categories c ORDER BY c.parent_id, c.id`
  ) as [any[], any];
  console.log("\n=== CATEGORIES ===");
  console.table(cats);

  const [stores] = await sequelize.query(
    `SELECT id, name FROM stores LIMIT 5`
  ) as [any[], any];
  console.log("\n=== STORES ===");
  console.table(stores);

  await sequelize.close();
})();
