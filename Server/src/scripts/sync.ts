import sequelize, { createSchemaIfNotExists } from "../config/database";
import "../models/index";

(async () => {
  try {
    await createSchemaIfNotExists();
    await sequelize.authenticate();
    console.log("Connected.");
    await sequelize.sync({ alter: true });
    console.log("Sync complete.");
    await sequelize.close();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
