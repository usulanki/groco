import { Sequelize } from "sequelize";
import { env } from "./env";

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: env.NODE_ENV === "development" ? console.log : false,
});

export async function createSchemaIfNotExists(): Promise<void> {
  const temp = new Sequelize("", env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: "mysql",
    logging: false,
  });
  await temp.query(`CREATE SCHEMA IF NOT EXISTS \`${env.DB_NAME}\`;`);
  await temp.close();
}

export default sequelize;
