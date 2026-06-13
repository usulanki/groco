import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  await sequelize.query(
    "ALTER TABLE `materials` ADD COLUMN `price` DECIMAL(10,2) NULL DEFAULT NULL AFTER `hsn_code`"
  );
  console.log("price column added to materials.");
  await sequelize.close();
})().catch((err) => { console.error(err.message); process.exit(1); });
