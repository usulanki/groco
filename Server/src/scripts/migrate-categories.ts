import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();

    await sequelize.query(
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS media_id INT UNSIGNED NULL DEFAULT NULL"
    );
    await sequelize.query(
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id INT UNSIGNED NULL DEFAULT NULL"
    );
    await sequelize.query(
      "ALTER TABLE categories ADD COLUMN IF NOT EXISTS outlet_id INT UNSIGNED NULL DEFAULT NULL"
    );

    const [fks] = await sequelize.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND REFERENCED_TABLE_NAME IS NOT NULL"
    );
    const fkNames = (fks as Array<{ CONSTRAINT_NAME: string }>).map((r) => r.CONSTRAINT_NAME);

    if (!fkNames.some((n) => n.includes("store"))) {
      await sequelize.query(
        "ALTER TABLE categories ADD CONSTRAINT categories_store_id_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL ON UPDATE CASCADE"
      );
      console.log("FK categories -> stores added.");
    } else {
      console.log("FK categories -> stores already exists.");
    }

    if (!fkNames.some((n) => n.includes("outlet"))) {
      await sequelize.query(
        "ALTER TABLE categories ADD CONSTRAINT categories_outlet_id_fk FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE SET NULL ON UPDATE CASCADE"
      );
      console.log("FK categories -> outlets added.");
    } else {
      console.log("FK categories -> outlets already exists.");
    }

    console.log("Migration complete.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
})();
