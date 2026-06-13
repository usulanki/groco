import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();

  await sequelize.query(
    "ALTER TABLE `products` ADD COLUMN `gender` VARCHAR(20) NULL DEFAULT NULL AFTER `seo_tags`"
  );
  console.log("gender column added to products.");

  await sequelize.query(
    "ALTER TABLE `products` ADD COLUMN `hsn_code` VARCHAR(50) NULL DEFAULT NULL AFTER `gender`"
  );
  console.log("hsn_code column added to products.");

  await sequelize.query(
    "ALTER TABLE `product_prices` ADD COLUMN `final_price` DECIMAL(10,2) NULL DEFAULT NULL AFTER `compare_at_price`"
  );
  console.log("final_price column added to product_prices.");

  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
