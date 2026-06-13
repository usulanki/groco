/**
 * Migration: Add media_id column + FK to brands table.
 * Safe to re-run — skips if column already exists.
 *
 * Run: npx tsx src/seeders/addMediaIdToBrands.ts
 */
import sequelize from "../config/database";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  // Check if media_id already exists
  const [cols] = await sequelize.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands' AND COLUMN_NAME = 'media_id'"
  ) as [Array<{ COLUMN_NAME: string }>, unknown];

  if (cols.length > 0) {
    console.log("Column media_id already exists on brands — skipping.");
    await sequelize.close();
    return;
  }

  await sequelize.query(
    "ALTER TABLE brands ADD COLUMN media_id INT UNSIGNED NULL AFTER slug"
  );
  console.log("Column media_id added to brands.");

  await sequelize.query(
    "ALTER TABLE brands ADD CONSTRAINT fk_brands_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  console.log("FK fk_brands_media added.");

  console.log("\nDone. Restart the server to apply model changes.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
