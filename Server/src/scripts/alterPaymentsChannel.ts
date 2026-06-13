/**
 * Aligns the `payments.channel` ENUM with the spec:
 *   ADMIN | WEBSITE | IOS_APP | ANDROID_APP
 *
 * The original CREATE script used CRM / WEB / ANDROID_APP / IOS_APP.
 * This script:
 *   1. Expands the ENUM to hold all old + new values
 *   2. Migrates existing rows:  CRM → ADMIN,  WEB → WEBSITE
 *   3. Collapses to the final ENUM (ADMIN, WEBSITE, IOS_APP, ANDROID_APP)
 *
 * Safe to re-run — all steps are idempotent against the final state.
 *
 * Run: npx ts-node src/scripts/alterPaymentsChannel.ts
 */
import sequelize from "../config/database";

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  // Step 1 – check if column exists
  const [cols] = await sequelize.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'channel'`
  ) as any[];
  const col = (cols as any[])[0];

  if (!col) {
    // Column doesn't exist — add it directly with the correct ENUM
    await sequelize.query(`
      ALTER TABLE \`payments\`
      ADD COLUMN \`channel\`
        ENUM('ADMIN','WEBSITE','IOS_APP','ANDROID_APP')
        NOT NULL DEFAULT 'ADMIN'
        AFTER \`email\`
    `);
    console.log("Step 1: column `channel` added with final ENUM (ADMIN, WEBSITE, IOS_APP, ANDROID_APP).");
  } else {
    const currentType: string = col.COLUMN_TYPE ?? col.column_type ?? '';
    const alreadyFinal = currentType.includes('ADMIN') && currentType.includes('WEBSITE')
      && !currentType.includes('CRM') && !currentType.includes("'WEB'");

    if (alreadyFinal) {
      console.log("Step 1: column `channel` already has the correct ENUM — skipping.");
    } else {
      // Widen ENUM to hold both old and new values
      await sequelize.query(`
        ALTER TABLE \`payments\`
        MODIFY COLUMN \`channel\`
          ENUM('CRM','WEB','ANDROID_APP','IOS_APP','ADMIN','WEBSITE')
          NOT NULL DEFAULT 'ADMIN'
      `);
      console.log("Step 1: ENUM widened.");

      // Migrate legacy values
      const [crmResult] = await sequelize.query(
        `UPDATE \`payments\` SET \`channel\` = 'ADMIN'   WHERE \`channel\` = 'CRM'`
      ) as any[];
      console.log(`Step 2a: CRM → ADMIN   (${(crmResult as any).affectedRows ?? 0} rows)`);

      const [webResult] = await sequelize.query(
        `UPDATE \`payments\` SET \`channel\` = 'WEBSITE' WHERE \`channel\` = 'WEB'`
      ) as any[];
      console.log(`Step 2b: WEB → WEBSITE (${(webResult as any).affectedRows ?? 0} rows)`);

      // Collapse to final ENUM
      await sequelize.query(`
        ALTER TABLE \`payments\`
        MODIFY COLUMN \`channel\`
          ENUM('ADMIN','WEBSITE','IOS_APP','ANDROID_APP')
          NOT NULL DEFAULT 'ADMIN'
      `);
      console.log("Step 3: ENUM collapsed to final values (ADMIN, WEBSITE, IOS_APP, ANDROID_APP).");
    }
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
