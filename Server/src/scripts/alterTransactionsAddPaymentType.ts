/**
 * Adds `payment_type` ENUM('Paid','Received','Adjust') column to the `transactions` table.
 * Run once: npx ts-node src/scripts/alterTransactionsAddPaymentType.ts
 */

import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function run() {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'transactions'
       AND COLUMN_NAME  = 'payment_type'`,
    { type: QueryTypes.SELECT },
  ) as any[];

  if ((rows as any).cnt > 0) {
    console.log('Column `payment_type` already exists — skipping.');
    process.exit(0);
  }

  await sequelize.query(`
    ALTER TABLE transactions
      ADD COLUMN payment_type ENUM('Paid','Received','Adjust') NOT NULL DEFAULT 'Paid'
        AFTER \`type\`
  `);

  console.log('✓ Added payment_type column to transactions');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
