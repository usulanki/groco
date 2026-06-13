/**
 * Adds deleted_by INT UNSIGNED NULL column to the 7 trash-tracked tables.
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/addDeletedByColumns.ts
 */
import sequelize from "../config/database";

const TABLES = ["vendors", "products", "materials", "users", "categories", "taxes", "uom"];

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    for (const table of TABLES) {
      const [cols] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = 'deleted_by'`
      ) as [Array<{ COLUMN_NAME: string }>, unknown];

      if (cols.length > 0) {
        console.log(`  ${table}: deleted_by already exists — skipped.`);
      } else {
        await sequelize.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`deleted_by\` INT UNSIGNED NULL DEFAULT NULL`
        );
        console.log(`  ${table}: deleted_by column added.`);
      }
    }

    console.log("\nMigration complete.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
})();
