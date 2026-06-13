import { env } from "./config/env";
import sequelize, { createSchemaIfNotExists } from "./config/database";
import "./models/index"; // register all models and associations
import app from "./app";

const start = async (): Promise<void> => {
  await createSchemaIfNotExists();
  await sequelize.authenticate();
  console.log("Database connected.");

  // await sequelize.sync({ alter: env.NODE_ENV === "development" });
  // console.log("Database synced.");

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
