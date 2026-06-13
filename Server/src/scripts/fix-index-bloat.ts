import sequelize from "../config/database";

/**
 * Drops duplicate non-primary, non-FK indexes from every table,
 * keeping only the one with the alphabetically lowest name per (table, column) pair.
 */
(async () => {
  try {
    await sequelize.authenticate();

    const [indexes] = await sequelize.query(`
      SELECT s.TABLE_NAME, s.INDEX_NAME, s.COLUMN_NAME, s.NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS s
      WHERE s.TABLE_SCHEMA = DATABASE()
        AND s.INDEX_NAME != 'PRIMARY'
        AND NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
          WHERE k.TABLE_SCHEMA = s.TABLE_SCHEMA
            AND k.TABLE_NAME = s.TABLE_NAME
            AND k.COLUMN_NAME = s.COLUMN_NAME
            AND k.REFERENCED_TABLE_NAME IS NOT NULL
        )
      ORDER BY s.TABLE_NAME, s.COLUMN_NAME, s.INDEX_NAME
    `) as [Array<{ TABLE_NAME: string; INDEX_NAME: string; COLUMN_NAME: string; NON_UNIQUE: number }>, unknown];

    // Group by table+column, keep first (alphabetically lowest), drop the rest
    const seen = new Map<string, string>();
    const toDrop: Array<{ table: string; name: string }> = [];

    for (const idx of indexes) {
      const key = `${idx.TABLE_NAME}.${idx.COLUMN_NAME}`;
      if (seen.has(key)) {
        toDrop.push({ table: idx.TABLE_NAME, name: idx.INDEX_NAME });
      } else {
        seen.set(key, idx.INDEX_NAME);
      }
    }

    if (toDrop.length === 0) {
      console.log("No duplicate indexes found.");
    } else {
      console.log(`Dropping ${toDrop.length} duplicate index(es)...`);
      for (const { table, name } of toDrop) {
        await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${name}\``);
        console.log(`  Dropped: ${table}.${name}`);
      }
    }

    console.log("Done.");
    await sequelize.close();
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
