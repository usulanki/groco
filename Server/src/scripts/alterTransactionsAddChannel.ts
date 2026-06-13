/**
 * Adds the `channel` column to the `transactions` table.
 *   ENUM('ADMIN','WEBSITE','IOS_APP','ANDROID_APP')  DEFAULT 'ADMIN'
 *
 * Safe to re-run — checks for the column first.
 *
 * Run: npx ts-node src/scripts/alterTransactionsAddChannel.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [cols] = await sequelize.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'transactions'
      AND COLUMN_NAME  = 'channel'
  `) as any[];

  if ((cols as any[]).length > 0) {
    console.log("Column `channel` already exists — skipping.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`transactions\`
      ADD COLUMN \`channel\`
        ENUM('ADMIN','WEBSITE','IOS_APP','ANDROID_APP')
        NOT NULL DEFAULT 'ADMIN'
        AFTER \`email\`
    `);
    console.log("Column `channel` added to `transactions`.");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
