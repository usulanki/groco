/**
 * Migration: add new fields to the `discounts` table.
 * Safe to re-run — uses ADD COLUMN IF NOT EXISTS pattern via raw SQL.
 *
 * Run with: npx ts-node src/seeders/alterDiscountsAddFields.ts
 */
import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const columns: { column: string; definition: string }[] = [
    { column: "name",           definition: "VARCHAR(255) NULL AFTER `code`" },
    { column: "is_first_order", definition: "TINYINT(1) NOT NULL DEFAULT 0" },
    { column: "free_shipping",  definition: "TINYINT(1) NOT NULL DEFAULT 0" },
    { column: "stackable",      definition: "TINYINT(1) NOT NULL DEFAULT 0" },
    { column: "auto_apply",     definition: "TINYINT(1) NOT NULL DEFAULT 0" },
    { column: "exclude_sale",   definition: "TINYINT(1) NOT NULL DEFAULT 0" },
  ];

  for (const { column, definition } of columns) {
    const [existing] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'discounts' AND COLUMN_NAME = ?`,
      { replacements: [column] }
    ) as [Array<unknown>, unknown];

    if ((existing as unknown[]).length > 0) {
      console.log(`Column "${column}": already exists — skipped.`);
    } else {
      await sequelize.query(`ALTER TABLE discounts ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Column "${column}": added.`);
    }
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
