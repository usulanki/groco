import sequelize from "../config/database";

/**
 * Migration: add 'confirmed' to orders.order_status ENUM.
 * Safe to run multiple times — MySQL re-applies the full enum definition.
 */
(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected.");

    await sequelize.query(`
      ALTER TABLE orders
      MODIFY COLUMN order_status
      ENUM('pending','confirmed','processing','shipped','delivered','cancelled')
      NOT NULL DEFAULT 'pending'
    `);
    console.log("orders.order_status ENUM updated: 'confirmed' added.");

    await sequelize.close();
    console.log("Done.");
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
