import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(
    "ALTER TABLE `products` ADD COLUMN `tax_id` INT UNSIGNED NULL DEFAULT NULL AFTER `hsn_code`"
  );
  console.log("tax_id column added to products.");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
