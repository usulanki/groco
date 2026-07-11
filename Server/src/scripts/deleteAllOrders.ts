import sequelize from "../config/database";
import "../models/index";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    await sequelize.query("SET FOREIGN_KEY_CHECKS=0");
    await sequelize.query("DELETE FROM order_history");
    await sequelize.query("DELETE FROM discount_usages");
    await sequelize.query("DELETE FROM payments");
    await sequelize.query("DELETE FROM order_items");
    await sequelize.query("DELETE FROM orders");
    await sequelize.query("SET FOREIGN_KEY_CHECKS=1");

    console.log("All orders and related records deleted.");
    await sequelize.close();
  } catch (err) {
    console.error("Failed to delete orders:", err);
    process.exit(1);
  }
})();
