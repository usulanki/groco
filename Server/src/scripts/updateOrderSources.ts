/**
 * updateOrderSources.ts
 * Randomly assigns WEB, IOS_APP, ANDROID_APP, or ADMIN to every order's source column.
 * Run: npx tsx src/scripts/updateOrderSources.ts
 */

import sequelize from "../config/database";

const SOURCES = ['WEB', 'IOS_APP', 'ANDROID_APP', 'ADMIN'];

(async () => {
  await sequelize.authenticate();
  console.log('Connected to database.');

  // Fetch all order IDs
  const [rows] = await sequelize.query(`SELECT id FROM \`orders\`;`) as [{ id: number }[], unknown];
  console.log(`Found ${rows.length} orders. Updating sources...`);

  // Update each order with a random source
  for (const row of rows) {
    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    await sequelize.query(
      `UPDATE \`orders\` SET \`source\` = :source WHERE \`id\` = :id;`,
      { replacements: { source, id: row.id } }
    );
  }

  // Print summary
  const [summary] = await sequelize.query(`
    SELECT source, COUNT(*) AS count
    FROM \`orders\`
    GROUP BY source
    ORDER BY count DESC;
  `) as [{ source: string; count: number }[], unknown];

  console.log('\nSource distribution:');
  summary.forEach(r => console.log(`  ${r.source.padEnd(14)} ${r.count} orders`));

  await sequelize.close();
  console.log('\nDone.');
})().catch(err => { console.error(err.message); process.exit(1); });
