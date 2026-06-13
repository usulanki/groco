/**
 * Adds columns required by the admin Create Order API to the `orders` table:
 *   - address_id       INT UNSIGNED NULL (FK → addresses)
 *   - payment_mode     ENUM NOT NULL DEFAULT 'cod'
 *   - payment_reference VARCHAR(100) NULL
 *   - notes            TEXT NULL
 *   - discount_amount  DECIMAL(10,2) NOT NULL DEFAULT 0
 *
 * Safe to re-run — each ADD is skipped if the column already exists.
 *
 * Run: npx tsx src/scripts/alterOrdersForCreate.ts
 */
import sequelize from "../config/database";

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  ) as any[];
  return (rows as any[]).length > 0;
}

(async () => {
  await sequelize.authenticate();
  console.log("DB connected.");

  // address_id
  if (await columnExists("orders", "address_id")) {
    console.log("SKIP: address_id already exists.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`address_id\` INT UNSIGNED NULL DEFAULT NULL
        AFTER \`user_id\`,
      ADD CONSTRAINT \`orders_address_fk\`
        FOREIGN KEY (\`address_id\`) REFERENCES \`addresses\` (\`id\`)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("ADD: address_id");
  }

  // payment_mode
  if (await columnExists("orders", "payment_mode")) {
    console.log("SKIP: payment_mode already exists.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`payment_mode\`
        ENUM('cod','online','wallet','card','upi')
        NOT NULL DEFAULT 'cod'
        AFTER \`source\`
    `);
    console.log("ADD: payment_mode");
  }

  // payment_reference
  if (await columnExists("orders", "payment_reference")) {
    console.log("SKIP: payment_reference already exists.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`payment_reference\` VARCHAR(100) NULL DEFAULT NULL
        AFTER \`payment_mode\`
    `);
    console.log("ADD: payment_reference");
  }

  // notes
  if (await columnExists("orders", "notes")) {
    console.log("SKIP: notes already exists.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`notes\` TEXT NULL DEFAULT NULL
        AFTER \`payment_reference\`
    `);
    console.log("ADD: notes");
  }

  // discount_amount
  if (await columnExists("orders", "discount_amount")) {
    console.log("SKIP: discount_amount already exists.");
  } else {
    await sequelize.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`discount_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0
        AFTER \`total\`
    `);
    console.log("ADD: discount_amount");
  }

  await sequelize.close();
  console.log("Done.");
})().catch((err) => { console.error(err.message); process.exit(1); });
