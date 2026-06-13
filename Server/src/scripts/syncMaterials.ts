import sequelize from "../config/database";
import "../models/index";
import Material from "../models/material.model";

(async () => {
  await sequelize.authenticate();
  console.log("Connected.");
  await Material.sync({ alter: true });
  console.log("materials table synced.");
  await sequelize.close();
})();
