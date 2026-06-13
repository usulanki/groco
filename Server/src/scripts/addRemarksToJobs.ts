import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  const [cols] = await sequelize.query("SHOW COLUMNS FROM background_jobs LIKE 'remarks'") as [unknown[], unknown];
  if ((cols as unknown[]).length === 0) {
    await sequelize.query("ALTER TABLE background_jobs ADD COLUMN remarks JSON NULL AFTER meta");
    console.log("remarks column: added");
  } else {
    console.log("remarks column: already exists");
  }
  await sequelize.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
