import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(
    "ALTER TABLE `returns` ADD COLUMN `store_id` INT UNSIGNED NOT NULL AFTER `code`, ADD CONSTRAINT `returns_store_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
  );
  console.log("store_id column added to returns.");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
